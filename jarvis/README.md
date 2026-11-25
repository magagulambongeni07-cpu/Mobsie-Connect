# JARVIS

A voice assistant for your computer. Clap twice and he wakes up, greets you with
the weather, answers out loud in a calm British voice, and opens your apps.
His brain is your own **Claude Code** login, so there's no API key to set up.

## Setup (once)

1. **Claude Code** must be installed and logged in on this computer:
   run `claude` in a terminal once and sign in.
2. **Python 3.9+**, then from this folder:
   ```
   pip install -r requirements.txt
   ```
   - Linux only: `sudo apt install libportaudio2` (needed for mic and speakers).
   - macOS: if the mic is silent, allow Terminal under
     System Settings → Privacy & Security → Microphone.
3. Optional: copy `config.example.json` to `config.json` and edit it
   (your city, what to call you, app nicknames).

## Run

```
python jarvis.py
```

Clap twice and wait for the greeting, then just talk:

- "What's on my mind is dinner, any ideas?"  → he answers aloud
- "Open Spotify" / "Launch the calculator"  → opens straight away
- "Open YouTube and my email"               → he works it out and opens both
- "That's all, Jarvis" / "Goodbye"          → back to sleep until the next double clap

He also goes back to sleep after two quiet spells of about 8 seconds each.

Other modes:

| Command | What it does |
|---|---|
| `python jarvis.py --calibrate` | Shows mic levels while you clap and suggests a `clap_threshold` |
| `python jarvis.py --no-clap` | Skips the clap and starts listening at once |
| `python jarvis.py --text` | Type instead of talking (no mic or speakers needed) |

## Settings (`config.json`)

| Key | Default | Meaning |
|---|---|---|
| `name` | `"sir"` | What Jarvis calls you |
| `city` | `""` | Weather location. Empty means he works it out from your IP address |
| `units` | `"celsius"` | Or `"fahrenheit"` |
| `voice` | `"en-GB-RyanNeural"` | Any edge-tts voice, e.g. `en-GB-ThomasNeural`, `en-GB-SoniaNeural` |
| `voice_rate` | `"-8%"` | Speaking speed, slightly slower than normal so he sounds calm |
| `model` | `"sonnet"` | Claude model alias: `haiku` is quickest, `opus` the cleverest |
| `clap_threshold` | `0.35` | Lower it if claps are missed, raise it if he wakes by himself |
| `apps` | `{}` | Nicknames, e.g. `"music": "Spotify"` |
| `websites` | `{}` | Spoken names to URLs, e.g. `"news": "https://bbc.co.uk/news"` |

## How it works

| File | Job |
|---|---|
| `clap.py` | Listens for two short, sharp sounds 0.12–0.8 s apart. Longer sounds such as speech and music don't count |
| `weather.py` | Open-Meteo forecast (free, no key), located by city or IP |
| `voice.py` | Microsoft neural British voice through edge-tts. Without internet it falls back to your system's own British voice |
| `ears.py` | Records until you stop talking, then turns your speech into text with Google's free speech recognition |
| `apps.py` | Finds installed apps (Start Menu on Windows, /Applications on macOS, .desktop files on Linux) and opens them |
| `brain.py` | Runs `claude -p` with no tools and a Jarvis persona, resuming the session so he remembers the conversation |

Jarvis can only open apps and websites. Claude runs with every tool switched
off, so it can't run commands or change files on your computer.

Run the tests with `python -m pytest tests`.
