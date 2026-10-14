"""Analysis-environment checks; not a game runtime dependency."""
import numpy as np
from analyze_music_attack_spectrum import peak

rate = 48000
mono = .3 * np.sin(2 * np.pi * 440 * np.arange(4096) / rate)
same = peak(np.column_stack((mono, mono)), rate)
opposite = peak(np.column_stack((mono, -mono)), rate)
assert abs(same["dominantPeakHz"] - 440) < 1
assert opposite == same, "Stereo phase must not cancel the analysis signal"
silent = peak(np.zeros((4096, 2)), rate)
assert silent["dominantPeakHz"] is None and silent["peakMidi"] is None
print("Spectral audit preserves opposite-phase stereo and rejects silence as note evidence")
