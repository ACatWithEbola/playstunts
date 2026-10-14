import numpy as np
from source_cycle_template import cycle_coefficients

rate=48000
t=np.arange(4800)/rate
mono=.2*np.sin(2*np.pi*200*t)+.03*np.cos(2*np.pi*2000*t)
m=cycle_coefficients(np.column_stack([mono,-mono]),rate,200)
c=np.asarray(m['stereoCoefficients'])
assert abs(c[1,0]-.2)<1e-4
assert abs(c[20,0]-.03)<3e-4, 'Upper harmonic lost beyond interpolation tolerance'
assert np.max(np.abs(c[:,0]+c[:,1]))<1e-12
assert not m['approvedForGame']
for x in [np.zeros((4800,2)),np.ones((10,2)),np.full((4800,2),np.nan)]:
    try:
        cycle_coefficients(x,rate,200)
    except ValueError:
        pass
    else:
        raise AssertionError('Invalid cycle input accepted')
print('Source cycles retain fundamental/upper harmonic and stereo phase; short, silent and nonfinite samples rejected')
