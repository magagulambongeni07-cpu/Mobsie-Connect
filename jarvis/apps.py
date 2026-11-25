"""Find and open applications (and websites) by spoken name, on any OS."""
import difflib
import glob
import os
import platform
import re
import shutil
import subprocess
import webbrowser

SYSTEM = platform.system()


def _norm(s):
    s = s.lower().replace("&", "and")
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    s = re.sub(r"\b(the|app|application|program|my|please)\b", " ", s)
    return " ".join(s.split())


def installed_apps():
    """Map normalised display name -> how to launch it on this OS."""
    apps = {}
    if SYSTEM == "Darwin":
        for d in ["/Applications", "/System/Applications", "/System/Applications/Utilities",
                  os.path.expanduser("~/Applications")]:
            for p in glob.glob(os.path.join(d, "*.app")):
                apps[_norm(os.path.basename(p)[:-4])] = ("mac", p)
    elif SYSTEM == "Windows":
        roots = [os.path.join(os.environ.get("ProgramData", r"C:\ProgramData"),
                              r"Microsoft\Windows\Start Menu\Programs"),
                 os.path.join(os.environ.get("APPDATA", ""), r"Microsoft\Windows\Start Menu\Programs")]
        for r in roots:
            for p in glob.glob(os.path.join(r, "**", "*.lnk"), recursive=True):
                name = os.path.basename(p)[:-4]
                if "uninstall" not in name.lower():
                    apps.setdefault(_norm(name), ("win", p))
    else:
        dirs = ["/usr/share/applications", "/usr/local/share/applications",
                os.path.expanduser("~/.local/share/applications"),
                "/var/lib/flatpak/exports/share/applications",
                os.path.expanduser("~/.local/share/flatpak/exports/share/applications"),
                "/var/lib/snapd/desktop/applications"]
        for d in dirs:
            for p in glob.glob(os.path.join(d, "*.desktop")):
                name = _desktop_name(p)
                if name:
                    apps.setdefault(_norm(name), ("linux", p))
                    apps.setdefault(_norm(os.path.basename(p)[:-8].split(".")[-1]), ("linux", p))
    return apps


def _desktop_name(path):
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            text = f.read()
    except OSError:
        return None
    if re.search(r"^NoDisplay\s*=\s*true", text, re.M | re.I):
        return None
    m = re.search(r"^Name\s*=\s*(.+)$", text, re.M)
    return m.group(1).strip() if m else None


def _launch(kind, target):
    if kind == "url":
        webbrowser.open(target)
    elif kind == "mac":
        subprocess.Popen(["open", target])
    elif kind == "win":
        os.startfile(target)  # noqa: works only on Windows
    elif kind == "linux":
        app_id = os.path.basename(target)
        if shutil.which("gtk-launch"):
            subprocess.Popen(["gtk-launch", app_id], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif shutil.which("gio"):
            subprocess.Popen(["gio", "launch", target], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            subprocess.Popen(["xdg-open", target])
    elif kind == "cmd":
        if SYSTEM == "Windows":
            subprocess.Popen('start "" "%s"' % target, shell=True)
        elif SYSTEM == "Darwin" and not shutil.which(target):
            subprocess.Popen(["open", "-a", target])
        else:
            subprocess.Popen([target], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                             start_new_session=True)


class AppOpener:
    def __init__(self, cfg):
        self.aliases = {_norm(k): v for k, v in (cfg.get("apps") or {}).items()}
        self.sites = {_norm(k): v for k, v in (cfg.get("websites") or {}).items()}
        self._installed = None

    @property
    def installed(self):
        if self._installed is None:
            self._installed = installed_apps()
        return self._installed

    def resolve(self, spoken):
        """Return (kind, target, display_name) or None."""
        name = _norm(spoken)
        if not name:
            return None
        if spoken.strip().lower().startswith(("http://", "https://")):
            return ("url", spoken.strip(), spoken.strip())
        if name in self.sites:
            return ("url", self.sites[name], spoken)
        if name in self.aliases:
            alias = self.aliases[name]
            hit = self.installed.get(_norm(alias))
            return (hit[0], hit[1], alias) if hit else ("cmd", alias, alias)
        if name in self.installed:
            k, t = self.installed[name]
            return (k, t, spoken)
        close = difflib.get_close_matches(name, list(self.installed), n=1, cutoff=0.75)
        if close:
            k, t = self.installed[close[0]]
            return (k, t, close[0])
        # e.g. "chrome" -> "google chrome"
        for key, (k, t) in self.installed.items():
            if re.search(r"\b%s\b" % re.escape(name), key):
                return (k, t, key)
        if shutil.which(name.replace(" ", "")):
            return ("cmd", name.replace(" ", ""), spoken)
        if re.fullmatch(r"[a-z0-9-]+\.(com|org|net|io|co\.uk|co\.za|dev|ai)", spoken.strip().lower()):
            return ("url", "https://" + spoken.strip().lower(), spoken)
        return None

    def open(self, spoken):
        """Open it. Return the name we opened, or None if we couldn't find it."""
        hit = self.resolve(spoken)
        if not hit:
            return None
        kind, target, display = hit
        try:
            _launch(kind, target)
        except Exception:
            return None
        return display.title() if display.islower() else display
