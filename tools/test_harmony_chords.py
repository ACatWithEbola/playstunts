"""Joint pitch evidence must distinguish missing and wrong chord notes."""
import numpy as np
from inspect_harmony_chords import inspect

rate=32000
time=np.arange(rate//2)/rate
events=[dict(pitch=p,startFrame=0,releaseFrame=len(time)) for p in [52,57]]
def signal(pitches):
    mono=sum(.1*np.sin(2*np.pi*440*2**((p-69)/12)*time) for p in pitches)
    return np.column_stack([mono,-mono])
correct=inspect(signal([52,57]),rate,events)
assert correct['windows']==1 and not correct['questionable']
assert correct['maxResidual']<1e-20 and not correct['approvedForGame']
assert inspect(signal([52]),rate,events)['questionable'], 'Missing voice escaped detection'
assert inspect(signal([52,58]),rate,events)['questionable'], 'Wrong semitone escaped detection'
assert inspect(signal([53,58]),rate,events)['questionable'], 'Shifted chord escaped detection'
print('Stable-chord fit: correct opposite-phase stereo passes; missing voice, wrong note and shifted chord rejected')
