#!/usr/bin/env python3
"""JARVIS: clap twice, and he's at your service.

    python jarvis.py              clap-to-wake voice assistant
    python jarvis.py --calibrate  measure your mic to tune clap sensitivity
    python jarvis.py --text       type instead of talk (handy for testing)
    python jarvis.py --no-clap    skip the clap, go straight to listening
"""
import argparse
import datetime
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import apps  # noqa: E402
import brain  # noqa: E402
import weather  # noqa: E402

DEFAULTS = {
    "name": "sir", "city": "", "units": "celsius",
    "voice": "en-GB-RyanNeural", "voice_rate": "-8%", "model": "sonnet",
    "clap_threshold": 0.35, "clap_min_gap": 0.12, "clap_max_gap": 0.8,
    "listen_timeout": 8, "idle_turns_before_sleep": 2, "apps": {}, "websites": {},
}

OPEN_CMD = re.compile(r"^(?:jarvis[, ]+)?(?:please |could you |can you )?(?:open|launch|start|fire up|run)"
                      r"(?: up)? (?:the |my )?(.+?)(?: for me)?(?: please)?[.!?]*$", re.I)
SLEEP_CMD = re.compile(r"^(?:thanks?(?: you)?,? )?(?:jarvis,? )?(?:that'?s all|goodbye|good night|bye|"
                       r"stand by|go to sleep|dismissed|that will be all|nothing else)\b", re.I)


def load_config():
    cfg = dict(DEFAULTS)
    path = os.path.join(HERE, "config.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            cfg.update(json.load(f))
    return cfg


def greeting(cfg):
    h = datetime.datetime.now().hour
    part = "Good morning" if h < 12 else "Good afternoon" if h < 18 else "Good evening"
    return "%s, %s. %s How may I help?" % (part, cfg["name"], weather.report(cfg))


class Jarvis:
    def __init__(self, cfg, text_mode=False):
        self.cfg = cfg
        self.text_mode = text_mode
        self.brain = brain.Brain(cfg)
        self.apps = apps.AppOpener(cfg)
        if text_mode:
            self.say = lambda t: print("JARVIS: " + t)
        else:
            import voice
            self.say = voice.Voice(cfg).say

    def hear(self):
        if self.text_mode:
            try:
                return input("YOU: ").strip()
            except EOFError:
                raise KeyboardInterrupt
        import ears
        return ears.listen(timeout=self.cfg["listen_timeout"])

    def open_things(self, names):
        opened, missing = [], []
        for n in names:
            (opened if self.apps.open(n) else missing).append(n)
        return opened, missing

    def handle(self, text):
        """Respond to one request. Return False when it's time to sleep."""
        if SLEEP_CMD.match(text):
            self.say("Very good, %s. I'll be here if you need me." % self.cfg["name"])
            return False

        m = OPEN_CMD.match(text)
        if m:  # Fast path: no need to think about "open Spotify".
            name = self.apps.open(m.group(1))
            if name:
                self.say("Opening %s." % name)
                return True

        reply = self.brain.ask(text)
        spoken, opens, sleep = brain.parse(reply)
        opened, missing = self.open_things(opens)
        if missing:
            spoken += " I'm afraid I couldn't find %s on this computer." % " or ".join(missing)
        self.say(spoken or ("Done." if opened else "Hmm."))
        return not sleep

    def conversation(self):
        idle = 0
        while True:
            text = self.hear()
            if text is None:  # silence
                idle += 1
                if idle >= self.cfg["idle_turns_before_sleep"]:
                    print("(standing by)")
                    return
                continue
            if not text:
                self.say("Sorry, I didn't catch that.")
                continue
            idle = 0
            if not self.handle(text):
                return

    def run(self, use_clap=True):
        print("JARVIS online. %s" % ("Clap twice to wake me." if use_clap else ""))
        if not self.brain.exe:
            print("Warning: the `claude` command was not found. Install Claude Code and log in first.")
        clap_wake = use_clap and not self.text_mode
        first = True
        while True:
            if clap_wake:
                import clap
                clap.wait_for_double_clap(self.cfg)
            if clap_wake or first:
                self.brain.reset()
                self.say(greeting(self.cfg))
            first = False
            self.conversation()
            if self.text_mode:
                return


def main():
    ap = argparse.ArgumentParser(description="JARVIS voice assistant")
    ap.add_argument("--calibrate", action="store_true", help="measure mic levels for clap detection")
    ap.add_argument("--text", action="store_true", help="type instead of speaking")
    ap.add_argument("--no-clap", action="store_true", help="don't wait for a double clap")
    args = ap.parse_args()
    cfg = load_config()
    if args.calibrate:
        import clap
        clap.calibrate()
        return
    try:
        Jarvis(cfg, text_mode=args.text).run(use_clap=not args.no_clap)
    except KeyboardInterrupt:
        print("\nJARVIS offline.")


if __name__ == "__main__":
    main()
