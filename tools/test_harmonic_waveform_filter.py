import numpy as np
from harmonic_waveform_filter import harmonic_filter

rate=48000
t=np.arange(rate//10)/rate
wanted=np.sin(2*np.pi*200*t)+.3*np.sin(2*np.pi*600*t)
unwanted=.7*np.sin(2*np.pi*3270*t)
x=np.column_stack([wanted+unwanted,-wanted-unwanted])
y=harmonic_filter(x,rate,200)
assert np.max(np.abs(y[:,0]-wanted))<1e-10
assert np.max(np.abs(y[:,0]+y[:,1]))<1e-12
assert np.sum((y[:,0]-wanted)**2)<np.sum(unwanted**2)*1e-10
for bad in [np.zeros((4800,2)),np.ones((4800,1)),np.full((4800,2),np.nan)]:
    try:
        harmonic_filter(bad,rate,200)
    except ValueError:
        pass
    else:
        raise AssertionError('Invalid input accepted')
print('Harmonic mask preserves known harmonics and opposite-phase stereo; rejects silence, malformed layout and nonfinite input')
