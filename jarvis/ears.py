"""Record one spoken request (stops when you go quiet) and turn it into text."""
import time

import numpy as np

RATE = 16000
BLOCK = 480  # 30 ms


def record_utterance(timeout=8.0, max_len=20.0, silence_after=1.0):
    """Return int16 PCM bytes of what was said, or None if nobody spoke."""
    import sounddevice as sd

    frames, started, quiet_for = [], False, 0.0
    noise = None
    t0 = time.time()
    with sd.InputStream(samplerate=RATE, channels=1, blocksize=BLOCK, dtype="int16") as s:
        # 300 ms to measure the room.
        cal = [s.read(BLOCK)[0] for _ in range(10)]
        noise = float(np.mean([np.sqrt(np.mean(c.astype(np.float32) ** 2)) for c in cal]))
        start_level = max(noise * 3.0, 400.0)
        while True:
            data, _ = s.read(BLOCK)
            level = float(np.sqrt(np.mean(data.astype(np.float32) ** 2)))
            elapsed = time.time() - t0
            if not started:
                frames = (frames + [data])[-10:]  # keep 300 ms of lead-in
                if level > start_level:
                    started = True
                elif elapsed > timeout:
                    return None
                continue
            frames.append(data)
            quiet_for = quiet_for + BLOCK / RATE if level < start_level * 0.7 else 0.0
            if quiet_for >= silence_after or elapsed > max_len:
                break
    return np.concatenate(frames).tobytes()


def transcribe(pcm):
    import speech_recognition as sr

    audio = sr.AudioData(pcm, RATE, 2)
    try:
        return sr.Recognizer().recognize_google(audio, language="en-GB")
    except sr.UnknownValueError:
        return ""


def listen(timeout=8.0):
    """Return the text of one request, "" if unintelligible, None if silence."""
    print("(listening...)")
    pcm = record_utterance(timeout=timeout)
    if pcm is None:
        return None
    text = transcribe(pcm)
    if text:
        print("YOU: " + text)
    return text
