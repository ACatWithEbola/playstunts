"""Read-only stereo attack spectrum. Peaks are not instrument/note proof.

Requires NumPy in an analysis environment, not the game runtime.
"""
import argparse
import hashlib
import json
import math
import subprocess
from pathlib import Path
import numpy as np


def peak(samples, rate):
    window = np.hanning(len(samples))[:, None]
    spectrum = np.fft.rfft(samples * window, n=65536, axis=0)
    # Sum channel energy instead of averaging opposite-phase stereo to silence.
    power = np.sum(np.abs(spectrum) ** 2, axis=1)
    frequencies = np.fft.rfftfreq(65536, 1 / rate)
    band = np.where((frequencies >= 70) & (frequencies <= 1000))[0]
    at = int(band[np.argmax(power[band])])
    rms = float(np.sqrt(np.mean(samples ** 2)))
    if rms <= 1e-6:
        return {"dominantPeakHz": None, "peakMidi": None, "rms": round(rms, 8)}
    hz = float(frequencies[at])
    midi = 69 + 12 * math.log2(hz / 440)
    bands = {}
    for note in [45, 52, 57, 64, 69, 76]:
        target = 440 * 2 ** ((note - 69) / 12)
        bins = np.abs(frequencies - target) <= 8
        bands[str(note)] = round(float(np.sum(power[bins]) / max(float(np.sum(power[band])), 1e-30)), 8)
    return {"dominantPeakHz": round(hz, 3), "peakMidi": round(midi, 3),
            "rms": round(rms, 8), "relativeBandEnergy": bands}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--cue", type=float, default=0)
    args = parser.parse_args()
    if not math.isfinite(args.cue) or args.cue < 0:
        raise ValueError("Invalid cue")
    source = args.source.resolve(strict=True)
    before = hashlib.sha256(source.read_bytes()).hexdigest()
    rate, count = 48000, 4096
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(source),
        "-af", f"atrim=start={args.cue},asetpts=PTS-STARTPTS", "-t", "1.2",
        "-ar", str(rate), "-ac", "2", "-f", "f32le", "pipe:1"])
    samples = np.frombuffer(raw, dtype="<f4").reshape(-1, 2)
    rows = []
    for start in [0, .025, .05, .075, .1, .15, .2, .3, .4, .6, .8, 1.0]:
        at = round(start * rate)
        if at + count > len(samples):
            raise ValueError("Insufficient opening audio")
        rows.append({"startSeconds": start, **peak(samples[at:at + count], rate)})
    if hashlib.sha256(source.read_bytes()).hexdigest() != before:
        raise ValueError("Source changed during analysis")
    print(json.dumps({"source": str(source), "sha256": before, "cue": args.cue,
        "windowSeconds": count / rate, "zeroPaddedBinHz": rate / 65536,
        "rows": rows, "individualNotesVerified": False,
        "scope": "Dominant stereo spectral peak; harmonics and mixed voices remain ambiguous"}))


if __name__ == "__main__":
    main()
