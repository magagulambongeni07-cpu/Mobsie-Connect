"""Jarvis's brain: your own Claude Code CLI, run headless.

Each request runs `claude -p` with no tools, a short Jarvis persona and
`--resume` so the conversation carries on. It uses whatever account the
`claude` command on this computer is logged in to, so there is no API key here.
"""
import datetime
import json
import os
import platform
import re
import shutil
import subprocess

PERSONA = """You are JARVIS, a voice assistant running on {user}'s {os} computer.
Your replies are spoken aloud by a calm British voice, so:
- Speak like a composed, dryly witty British butler. Address the user as "{name}" now and then, not every line.
- Keep it brief: one to three short sentences unless asked for detail.
- Plain spoken English only. No markdown, lists, code, emoji or URLs read out.
- Numbers and units as they would be said aloud.

You can act on the computer by adding tags on their own line at the end of a reply:
[[OPEN: <app name or https:// url>]]  opens an application or website. One tag per thing to open.
[[SLEEP]]  when the user says goodbye, thanks you off, or asks you to stand by.
Only use tags when the user asks for that action. Never claim to have done anything else on the computer.

Current local time: {now}."""

TAG = re.compile(r"\[\[\s*(OPEN|SLEEP)\s*:?\s*(.*?)\s*\]\]", re.I)


def find_claude():
    exe = shutil.which("claude")
    if exe:
        return exe
    for p in ["~/.claude/local/claude", "~/.local/bin/claude", "~/.npm-global/bin/claude",
              "/opt/homebrew/bin/claude", "/usr/local/bin/claude",
              os.path.expandvars(r"%APPDATA%\npm\claude.cmd")]:
        p = os.path.expanduser(p)
        if os.path.exists(p):
            return p
    return None


def parse(reply):
    """Split a reply into (spoken_text, [things_to_open], sleep_flag)."""
    opens, sleep = [], False
    for kind, arg in TAG.findall(reply):
        if kind.upper() == "OPEN" and arg:
            opens.append(arg)
        elif kind.upper() == "SLEEP":
            sleep = True
    spoken = " ".join(TAG.sub("", reply).split())
    return spoken, opens, sleep


class Brain:
    def __init__(self, cfg):
        self.cfg = cfg
        self.exe = find_claude()
        self.session = None
        # Run from a neutral folder so no project's CLAUDE.md leaks in.
        self.home = os.path.join(os.path.expanduser("~"), ".jarvis")
        os.makedirs(self.home, exist_ok=True)

    def reset(self):
        self.session = None

    def _persona(self):
        return PERSONA.format(
            user=os.environ.get("USER") or os.environ.get("USERNAME") or "the user",
            os={"Darwin": "Mac", "Windows": "Windows"}.get(platform.system(), "Linux"),
            name=self.cfg.get("name", "sir"),
            now=datetime.datetime.now().strftime("%A %d %B %Y, %H:%M"),
        )

    def ask(self, text):
        if not self.exe:
            return "I can't find Claude Code on this computer. Please install it and run claude once to log in."
        cmd = [self.exe, "-p", text, "--output-format", "json", "--tools", "",
               "--strict-mcp-config", "--disable-slash-commands",
               "--system-prompt", self._persona()]
        if self.cfg.get("model"):
            cmd += ["--model", self.cfg["model"]]
        if self.session:
            cmd += ["--resume", self.session]
        try:
            out = subprocess.run(cmd, cwd=self.home, capture_output=True, text=True,
                                 timeout=self.cfg.get("brain_timeout", 90), stdin=subprocess.DEVNULL)
        except subprocess.TimeoutExpired:
            return "My apologies, that took rather too long. Shall we try again?"
        try:
            data = json.loads(out.stdout)
        except json.JSONDecodeError:
            err = (out.stderr or out.stdout).strip().splitlines()
            print("[brain error] " + (err[-1] if err else "no output"))
            if "login" in (out.stderr + out.stdout).lower():
                return "It seems I'm not logged in. Please run claude in a terminal and sign in."
            return "I'm afraid my thoughts are a little scrambled. Could you say that again?"
        self.session = data.get("session_id", self.session)
        if data.get("is_error"):
            print("[brain error] " + str(data.get("result")))
            return "Something went wrong on my end, I'm afraid."
        return data.get("result", "")
