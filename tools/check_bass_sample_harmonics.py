import numpy as np
from analyze_bass_sample_harmonics import fit
rate = 8000
time = np.arange(1200) / rate
tone = .1 * np.sin(2 * np.pi * 62 * time) + .05 * np.cos(2 * np.pi * 124 * time)
samples = np.column_stack([tone, -tone])
result = fit(samples, rate, 58, 66)
assert abs(result['fundamentalHz'] - 62) < .026
assert result['residualEnergyFraction'] < 1e-12
offset=fit(samples+np.array([10.,-5.]),rate,58,66)
assert abs(offset['fundamentalHz']-result['fundamentalHz'])<1e-12
assert offset['residualEnergyFraction']<1e-12
try:
    fit(np.full((1200,2),.1),rate,58,66)
except ValueError:
    pass
else:
    raise AssertionError('Constant DC must not establish pitch')
# Large DC must not conceal an unrelated tone outside the searched band.
wrong=.001*np.sin(2*np.pi*733*time)
bad=fit(np.column_stack([wrong+10,wrong-5]),rate,58,66)
assert bad['residualEnergyFraction']>.9
try:
    fit(np.zeros((1200, 2)), rate, 58, 66)
except ValueError:
    pass
else:
    raise AssertionError('Silence cannot establish a harmonic sample')
print('Synthetic stereo harmonic fit retains opposite-phase energy and rejects silence; real sample purity not certified')
high_rate = 16000
high_time = np.arange(800) / high_rate
high_tone = .1 * np.sin(2 * np.pi * 740 * high_time)
high = fit(np.column_stack([high_tone, -high_tone]), high_rate, 700, 780, .5)
assert abs(high['fundamentalHz'] - 740) < .001
assert high['residualEnergyFraction'] < 1e-12
print('Explicit higher-rate search resolves synthetic lead-register pitch without changing default bass analysis')
rich_tone = tone + .03*np.sin(2*np.pi*62*16*time)
rich_pcm = np.column_stack([rich_tone, -rich_tone])
limited = fit(rich_pcm, rate, 61, 63, .025, 8)
extended = fit(rich_pcm, rate, 61, 63, .025, 16)
assert limited['residualEnergyFraction'] > .05
assert extended['residualEnergyFraction'] < 1e-12
assert len(extended['stereoCoefficients']) == 33
print('Higher harmonics are measured explicitly; default lower-order model reports their missing energy')
