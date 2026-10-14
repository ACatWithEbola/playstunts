import numpy as np
from inspect_percussion_candidates import inspect
rate = 16000
time = np.arange(rate//2)/rate
for hz, band in [(80, 0), (800, 1), (5000, 2)]:
    signal = np.sin(2*np.pi*hz*time)*.2
    signal[(time < .1) | (time >= .2)] = 0
    same = inspect(np.column_stack([signal, signal]), rate)
    opposite = inspect(np.column_stack([signal, -signal]), rate)
    assert same == opposite, 'Opposite-phase stereo must retain transient evidence'
    assert any(event['bands'] and event['bands'][band] > .95 for event in same)
try:
    inspect(np.zeros((8000, 2)), rate)
except ValueError:
    pass
else:
    raise AssertionError('Silence is not drum evidence')
print('Synthetic low/mid/high transients and opposite-phase stereo are retained; silence rejects')

# A quiet high hit must not disappear behind the threshold of a louder kick.
time = np.arange(rate)/rate
low = np.sin(2*np.pi*80*time)*((time >= .1)&(time < .2))
high = np.sin(2*np.pi*5000*time)*.01*((time >= .5)&(time < .6))
pcm = np.column_stack([low+high, low-high])
filtered = np.column_stack([high, -high])
assert not any(.49 < event.get('seconds', -1) < .6 for event in inspect(pcm, rate))
assert any(.49 < event.get('seconds', -1) < .6 for event in inspect(pcm, rate, filtered))
try:
    inspect(pcm, rate, filtered[:-1])
except ValueError:
    pass
else:
    raise AssertionError('Mismatched filtered timeline must reject')
print('Separate high-band detection finds quiet hits hidden by loud low-band peaks without replacing original spectral evidence')

# A song-global threshold must not certify a quiet local tail as hit-free.
time=np.arange(rate*3)/rate
carrier=np.sin(2*np.pi*5000*time)
signal=carrier*((time>=.1)&(time<.12))
signal+=carrier*.1*((time>=1.1)&(time<1.12))
signal+=carrier*.06*((time>=1.5)&(time<1.52))
stereo=np.column_stack([signal,-signal])
global_events=inspect(stereo,rate,stereo)
assert not any(1.49<event['frame']/rate<1.53 for event in global_events)
window=stereo[rate:rate*2]
local_events=inspect(window,rate,window)
assert any(.49<event['frame']/rate<.53 for event in local_events)
print('Local tail re-screen catches a secondary hit hidden by the song-global transient threshold')
