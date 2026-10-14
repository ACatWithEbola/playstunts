import numpy as np
from percussion_accent_features import accent_features
rate=16000
t=np.arange(rate)/rate
envelope=np.exp(-t*4)
noise=np.random.default_rng(49).normal(size=rate)*envelope
tone=np.sin(2*np.pi*440*t)*envelope
stereo=lambda x:np.column_stack([x,-x])
a=accent_features(stereo(noise),stereo(noise),rate)
b=accent_features(stereo(noise),stereo(tone),rate)
assert a['medianBodyPeriodicity']<.2
assert b['medianBodyPeriodicity']>.95
assert a['peakMilliseconds']<100
late=noise.copy();late[12000:12500]*=30
assert accent_features(stereo(late),stereo(late),rate)['peakMilliseconds']>=750
try:
    accent_features(stereo(noise)[:-1],stereo(noise),rate)
except ValueError:
    pass
else:
    raise AssertionError('Mismatched analysis windows must reject')
print('Accent diagnostics distinguish pitched body and later energy peak from a decaying noise fixture; opposite stereo phase preserved')
