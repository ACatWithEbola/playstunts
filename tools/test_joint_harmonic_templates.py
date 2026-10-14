import numpy as np
from joint_harmonic_templates import joint_templates

rate=16000
time=np.arange(800)/rate
hz=[165.275,221]
parts=[np.column_stack([np.sin(2*np.pi*f*time)*.3,
                       np.cos(2*np.pi*f*time)*.2]) for f in hz]
samples=parts[0]+parts[1]+np.array([.01,-.02])
result=joint_templates(samples,rate,hz)
assert result['residualEnergyFraction'] < 1e-20
assert np.max(np.abs(np.array(result['unassignedDC'])-[.01,-.02])) < 1e-12
for index, model in enumerate(result['models']):
    coefficients=np.array(model['stereoCoefficients'])
    matrix=np.column_stack([np.ones(len(time))]+[
        fn(2*np.pi*hz[index]*h*time) for h in range(1,9)
        for fn in [np.sin,np.cos]])
    assert np.max(np.abs(matrix@coefficients-parts[index])) < 1e-12
for bad in [[165.275,165.275],[165,220]]:
    try:
        joint_templates(samples,rate,bad)
    except ValueError:
        pass
    else:
        raise AssertionError('Shared exact harmonics must not be silently assigned')
assert result['cleanSeparationVerified'] is False
print('Joint fit recovers known stereo parts and leaves DC unassigned; duplicate/shared exact harmonics fail rather than fabricate separation')
