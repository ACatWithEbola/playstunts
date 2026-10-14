import numpy as np
from inspect_suno_onset import quiet_onset
rate=16000
t=np.arange(round(.4*rate))/rate
for phase in [0,.4,1.7]:
    mono=np.where(t>=.14,.2*np.sin(2*np.pi*55*t+phase),0)
    report=quiet_onset(np.column_stack([mono,mono*.7]),rate)
    assert abs(report['onsetFrame']/rate-.14)<=.004
    assert report['sourceAttackVerified'] is False
for invalid in [np.zeros((6400,2)),np.ones((6400,2)),np.full((6400,2),np.nan),np.ones((10,2))]:
    try:
        quiet_onset(invalid,rate)
        raise AssertionError('Invalid/continuous interval accepted')
    except ValueError:
        pass
two=np.where(((t>=.06)&(t<.16))|(t>=.26),.2*np.sin(2*np.pi*100*t),0)
try:
    quiet_onset(np.column_stack([two,two]),rate)
    raise AssertionError('Multiple source onsets accepted')
except ValueError:
    pass
print('Bounded onset screening brackets low-frequency starts, rejects continuous/silent/ambiguous intervals; not musical acceptance')
