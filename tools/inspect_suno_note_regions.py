"""Estimate sustained source-note regions for bounded inspection, not note approval."""
import json
import subprocess
import sys
import numpy as np
from inspect_suno_spectral_motion import motion_fit

source=sys.argv[1]
limit=int(sys.argv[2]) if len(sys.argv)>2 else 8
if not 1<=limit<=64:
    raise ValueError('Require region limit1..64')
rate=16000
raw=subprocess.check_output(['ffmpeg','-v','error','-i',source,'-t','20',
    '-ar',str(rate),'-ac','2','-f','f32le','pipe:1'])
pcm=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
channel=int(np.argmax(np.sum(pcm**2,axis=0)))
def estimate_pitch(frame):
    # Bounded YIN difference estimate, FFT correlation, fixed comparison span.
    window=1024
    lags=np.arange(401)
    power=np.r_[0,np.cumsum(frame**2)]
    correlation=np.fft.irfft(np.fft.rfft(frame,4096)*np.conj(np.fft.rfft(frame[:window],4096)),4096)[:401]
    difference=np.maximum(0,power[window]+power[lags+window]-power[lags]-2*correlation)
    normalized=np.ones(401)
    cumulative=np.cumsum(difference[1:])
    normalized[1:]=difference[1:]*np.arange(1,401)/np.maximum(cumulative,1e-20)
    if power[window]<1e-10:
        return 0
    candidates=np.where(normalized[16:400]<.15)[0]+16
    lag=int(candidates[0]) if len(candidates) else int(np.argmin(normalized[16:400])+16)
    while lag<399 and normalized[lag+1]<normalized[lag]:
        lag+=1
    a,b,c=normalized[lag-1:lag+2]
    delta=.5*(a-c)/(a-2*b+c) if abs(a-2*b+c)>1e-12 else 0
    return rate/(lag+float(np.clip(delta,-.5,.5)))

padded=np.pad(pcm[:,channel],1024,mode='reflect')
f0=np.array([estimate_pitch(padded[start:start+2048]) for start in range(0,len(pcm),160)])
labels=np.round(69+12*np.log2(np.maximum(f0,1e-10)/440)).astype(int)
regions=[]
edges=np.r_[0,np.where(labels[1:]!=labels[:-1])[0]+1,len(labels)]
for left,right in zip(edges,edges[1:]):
    # Avoid transitions: a pitch detector window straddles note boundaries.
    start=round((left*.01+.07)*rate)
    end=min(round((right*.01-.07)*rate),start+round(.5*rate),len(pcm))
    if end-start < rate*.12:
        continue
    hz=float(np.median(f0[left:right]))
    if hz*16>=rate/2:
        continue
    part=pcm[start:end]
    try:
        report=motion_fit(part,rate,hz)
    except ValueError:
        continue
    regions.append(dict(startSeconds=start/rate,seconds=(end-start)/rate,
        estimatedFundamentalHz=hz,estimatedMidi=int(labels[left]),
        staticResidual=report['staticResidual'],dynamicResidual=report['dynamicResidual'],
        maxWindowResidual=report['maxWindowResidual'],
        rms=float(np.sqrt(np.mean(part**2)))))
regions=sorted(regions,key=lambda region:region['maxWindowResidual'])[:limit]
print(json.dumps(dict(source=source,analysisSeconds=len(pcm)/rate,regions=regions,
    sourcePitchVerified=False,sourceAttackVerified=False,
    scope='Estimated YIN regions; harmonic residual is a screening metric, not isolated instrument or musical acceptance')))
