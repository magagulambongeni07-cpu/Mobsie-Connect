"""Text to speech in a calm British voice.

First choice: Microsoft's neural "en-GB-RyanNeural" via edge-tts (needs internet).
Fallback: the operating system's own British voice (offline).
"""
import asyncio
import platform
import subprocess


class Voice:
    def __init__(self, cfg):
        self.voice = cfg.get("voice", "en-GB-RyanNeural")
        self.rate = cfg.get("voice_rate", "-8%")
        self.muted = cfg.get("mute", False)

    def say(self, text):
        print("JARVIS: " + text)
        if self.muted or not text.strip():
            return
        try:
            self._neural(text)
        except Exception:
            self._offline(text)

    def _neural(self, text):
        import edge_tts
        import miniaudio
        import numpy as np
        import sounddevice as sd

        async def synth():
            buf = bytearray()
            async for chunk in edge_tts.Communicate(text, self.voice, rate=self.rate).stream():
                if chunk["type"] == "audio":
                    buf.extend(chunk["data"])
            return bytes(buf)

        mp3 = asyncio.run(synth())
        if not mp3:
            raise RuntimeError("no audio")
        pcm = miniaudio.decode(mp3, output_format=miniaudio.SampleFormat.SIGNED16,
                               nchannels=1, sample_rate=24000)
        sd.play(np.frombuffer(pcm.samples, dtype=np.int16), 24000)
        sd.wait()

    def _offline(self, text):
        if platform.system() == "Darwin":
            subprocess.run(["say", "-v", "Daniel", "-r", "175", text])
            return
        import pyttsx3
        eng = pyttsx3.init()
        for v in eng.getProperty("voices"):
            tag = (v.id + " " + (v.name or "") + " " + str(v.languages)).lower()
            if "en-gb" in tag or "en_gb" in tag or "british" in tag or "george" in tag or "hazel" in tag:
                eng.setProperty("voice", v.id)
                break
        eng.setProperty("rate", 170)
        eng.say(text)
        eng.runAndWait()
