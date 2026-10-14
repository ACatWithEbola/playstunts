import numpy as np
from soft_percussive_separation import split_percussive

rate=16000
t=np.arange(rate*2)/rate
tone=.2*np.sin(2*np.pi*440*t)
noise=np.random.default_rng(49).normal(size=len(t))*.1*np.exp(-np.maximum(0,t-.5)*7)
noise[t<.5]=0
mono=tone+noise
source=np.column_stack([mono,-mono])
p,h=split_percussive(source)
assert np.max(np.abs(p+h-source))<1e-12
assert np.max(np.abs(p[:,0]+p[:,1]))<1e-12
# The steady pre-accent pitched region should be suppressed, not relabeled noise.
region=slice(4000,6000)
assert np.mean(p[region]**2)<np.mean(source[region]**2)*.2
assert np.mean(p[8000:10000]**2)>np.mean(p[region]**2)*3
print('Soft separation suppresses steady tone in a known noise-accent mixture; two outputs sum to original and preserve opposite stereo phase. No real-source isolation approval.')
