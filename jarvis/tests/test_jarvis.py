import os, sys
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from clap import ClapDetector, SAMPLE_RATE, BLOCK
import brain, weather, jarvis

rng = np.random.default_rng(0)

def run(signal):
    d = ClapDetector()
    hits = 0
    for i in range(0, len(signal) - BLOCK + 1, BLOCK):
        hits += d.feed(signal[i:i + BLOCK])
    return hits

def room(sec):  # quiet background hiss
    return (rng.normal(0, 0.005, int(sec * SAMPLE_RATE))).astype(np.float32)

def clap():  # 40 ms sharp decaying burst
    n = int(0.04 * SAMPLE_RATE)
    return (rng.normal(0, 0.4, n) * np.exp(-np.linspace(0, 8, n))).clip(-1, 1).astype(np.float32) + 0.0

def seq(*parts):
    return np.concatenate(parts)

def test_double_clap_wakes():
    assert run(seq(room(1), clap(), room(0.35), clap(), room(1))) == 1

def test_single_clap_does_not_wake():
    assert run(seq(room(1), clap(), room(2))) == 0

def test_claps_too_far_apart():
    assert run(seq(room(1), clap(), room(1.5), clap(), room(1))) == 0

def test_long_loud_sound_is_not_a_clap():
    t = np.arange(int(0.6 * SAMPLE_RATE)) / SAMPLE_RATE
    voice = (0.6 * np.sin(2 * np.pi * 220 * t)).astype(np.float32)
    assert run(seq(room(1), voice, room(0.3), voice, room(1))) == 0

def test_parse_tags():
    s, o, z = brain.parse("Right away.\n[[OPEN: Spotify]]\n[[OPEN: https://bbc.co.uk]]")
    assert s == "Right away." and o == ["Spotify", "https://bbc.co.uk"] and not z
    assert brain.parse("Goodbye, sir. [[SLEEP]]")[2]

def test_open_and_sleep_phrases():
    assert jarvis.OPEN_CMD.match("Open Spotify").group(1) == "Spotify"
    assert jarvis.OPEN_CMD.match("Jarvis, could you launch the calculator please").group(1) == "calculator"
    assert not jarvis.OPEN_CMD.match("what's open on Sunday")
    assert jarvis.SLEEP_CMD.match("thank you jarvis, that's all")
    assert jarvis.SLEEP_CMD.match("Goodbye")
    assert not jarvis.SLEEP_CMD.match("what's the weather")

def test_weather_sentence():
    data = {"current": {"temperature_2m": 17.6, "weather_code": 61},
            "daily": {"temperature_2m_max": [21.2], "temperature_2m_min": [11.4],
                      "precipitation_probability_max": [70]}}
    s = weather.describe(data, "London")
    assert "18 degrees in London with light rain" in s and "umbrella" in s
