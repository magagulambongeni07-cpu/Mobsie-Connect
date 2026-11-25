"""Double-clap wake detector.

A clap is a short, sharp spike: loud relative to the room's background noise,
and over within ~150 ms. Speech and music stay loud for longer, so they are
rejected. Two claps 0.12-0.8 s apart wake Jarvis.
"""
import time
from collections import deque

import numpy as np

SAMPLE_RATE = 16000
BLOCK = 160  # 10 ms


class ClapDetector:
    """Feed it 10 ms blocks of float32 audio; it returns True on a double clap.

    Kept free of any audio-device code so it can be tested with synthetic sound.
    """

    def __init__(self, threshold=0.35, min_gap=0.12, max_gap=0.8,
                 max_clap_len=0.15, ratio=6.0):
        self.threshold = threshold      # absolute peak level (0..1) a clap must reach
        self.ratio = ratio              # ...and this many times the background level
        self.min_gap = min_gap
        self.max_gap = max_gap
        self.max_clap_len = max_clap_len
        self.noise = 0.01               # running background RMS estimate
        self.loud_since = None          # time a loud burst started
        self.loud_peak = 0.0
        self.claps = deque(maxlen=3)
        self.t = 0.0                    # stream time in seconds

    def feed(self, block):
        block = np.asarray(block, dtype=np.float32).reshape(-1)
        dt = len(block) / SAMPLE_RATE
        self.t += dt
        peak = float(np.max(np.abs(block))) if len(block) else 0.0
        rms = float(np.sqrt(np.mean(block ** 2))) if len(block) else 0.0

        loud = peak >= self.threshold and peak >= self.ratio * max(self.noise, 1e-4)

        if loud:
            if self.loud_since is None:
                self.loud_since = self.t
                self.loud_peak = peak
            else:
                self.loud_peak = max(self.loud_peak, peak)
            return False

        # Quiet block: only quiet blocks teach us the background level.
        self.noise = 0.995 * self.noise + 0.005 * rms

        if self.loud_since is not None:
            length = self.t - self.loud_since
            onset = self.loud_since
            self.loud_since = None
            if length <= self.max_clap_len:
                return self._register(onset)
            # Too long to be a clap (speech, music, a door): forget pending claps.
            self.claps.clear()
        return False

    def _register(self, onset):
        while self.claps and onset - self.claps[0] > self.max_gap:
            self.claps.popleft()
        if self.claps:
            gap = onset - self.claps[-1]
            if gap < self.min_gap:
                return False  # echo of the same clap
            if gap <= self.max_gap:
                self.claps.clear()
                return True
        self.claps.append(onset)
        return False


def wait_for_double_clap(cfg, on_level=None):
    """Block until the microphone hears a double clap."""
    import sounddevice as sd

    det = ClapDetector(threshold=cfg.get("clap_threshold", 0.35),
                       min_gap=cfg.get("clap_min_gap", 0.12),
                       max_gap=cfg.get("clap_max_gap", 0.8))
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, blocksize=BLOCK,
                        dtype="float32") as stream:
        # Let the noise estimate settle before trusting it.
        for _ in range(50):
            data, _ = stream.read(BLOCK)
            det.noise = 0.9 * det.noise + 0.1 * float(np.sqrt(np.mean(data ** 2)))
        while True:
            data, _ = stream.read(BLOCK)
            if on_level:
                on_level(float(np.max(np.abs(data))), det.noise)
            if det.feed(data[:, 0]):
                return


def calibrate(seconds=10):
    """Print live mic levels so the user can pick a clap_threshold."""
    import sounddevice as sd

    print("Calibrating for %d s. Stay quiet for a moment, then clap a few times." % seconds)
    peaks = []
    end = time.time() + seconds
    with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, blocksize=1600,
                        dtype="float32") as stream:
        while time.time() < end:
            data, _ = stream.read(1600)
            p = float(np.max(np.abs(data)))
            peaks.append(p)
            print("level %.3f %s" % (p, "#" * int(p * 60)))
    quiet = float(np.percentile(peaks, 30))
    loud = float(np.max(peaks))
    suggestion = round(max(quiet * 6, (quiet + loud) / 2), 2)
    print("\nBackground ~%.3f, loudest ~%.3f." % (quiet, loud))
    print('Suggested setting in config.json: "clap_threshold": %.2f' % suggestion)
