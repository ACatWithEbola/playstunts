"""Negative controls for wide note search; no Suno acceptance."""
import math
import numpy as np
from analyze_bass_sample_harmonics import fit

rate = 32000
expected = 440*2**((40-69)/12)
for seconds in [.016, .025, .05]:
    time = np.arange(round(rate*seconds))/rate
    for cents in [0, 13, -100, 100]:
        hz = expected*2**(cents/1200)
        signal = sum(np.sin(2*np.pi*hz*h*time+.3*h)/h
                     for h in range(1, 9))
        samples = np.column_stack([signal, -signal*.7])
        result = fit(samples, rate, expected*2**(-2/12),
                     expected*2**(2/12), .1)
        measured = 1200*math.log2(result['fundamentalHz']/expected)
        assert abs(measured-cents) < 2, (seconds, cents, measured)
        assert (abs(measured) >= 50) == (abs(cents) >= 50)
print('Wide search distinguishes adjacent wrong semitones from13-cent tuning variation in16/25/50ms synthetic bass windows; not audible fidelity approval')
