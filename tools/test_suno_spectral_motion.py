import numpy as np
from inspect_suno_spectral_motion import motion_fit
from compare_suno_spectral_motion import compare_motion
rate=16000
time=np.arange(6400)/rate
envelope=.05+.3*time/.4
left=envelope*np.sin(2*np.pi*250*time)+.1*(1-time/.4)*np.sin(2*np.pi*500*time+.3)
right=.7*envelope*np.sin(2*np.pi*250*time+.1)
samples=np.column_stack([left,right])
report=motion_fit(samples,rate,250,8)
assert report['dynamicResidual'] < report['staticResidual']*.1
assert report['sunoCharacterVerified'] is False
assert report['heldOutNoteVerified'] is False
first=np.array(report['windows'][0]['amplitudes'])
last=np.array(report['windows'][-1]['amplitudes'])
assert last[0,0] > first[0,0]*3
assert last[1,0] < first[1,0]*.2
held_out=motion_fit(samples*.7,rate,250,8)
comparison=compare_motion(report,held_out)
assert comparison['dynamic']['normalizedSquaredError'] < 1e-15
assert comparison['static']['normalizedSquaredError'] > .05
assert abs(comparison['dynamic']['globalGain']-.7)<1e-12
assert comparison['sunoCharacterVerified'] is False
fixed_shape=np.column_stack([envelope*np.sin(2*np.pi*250*time),.7*envelope*np.sin(2*np.pi*250*time+.1)])
fixed=motion_fit(fixed_shape,rate,250,8)
fixed_test=motion_fit(fixed_shape*.7,rate,250,8)
fixed_comparison=compare_motion(fixed,fixed_test)
assert fixed_comparison['amplitudeOnly']['normalizedSquaredError'] < 1e-6
assert fixed_comparison['static']['normalizedSquaredError'] > .05
assert abs(fixed_comparison['amplitudeOnly']['globalGain']-.7)<1e-6
for invalid in [np.zeros((6400,2)),np.ones((6400,2)),np.ones((100,2)),np.full((6400,2),np.nan)]:
    try:
        motion_fit(invalid,rate,250,8)
        raise AssertionError('Invalid evidence accepted')
    except ValueError:
        pass
for harmonics in [0,33,8.5]:
    try:
        motion_fit(samples,rate,250,harmonics)
        raise AssertionError('Invalid harmonic layout accepted')
    except ValueError:
        pass
print('Time-varying harmonic magnitudes track synthetic timbre/envelope motion without pitch modulation; invalid evidence rejected')
