"""Bounded quiet-to-energy onset screening; not instrument/pitch acceptance."""
import json
import subprocess
import sys
import numpy as np


def quiet_onset(samples, rate):
    if samples.ndim != 2 or samples.shape[1] != 2 or not np.all(np.isfinite(samples)):
        raise ValueError('Require finite stereo')
    if not isinstance(rate, int) or not 8000 <= rate <= 96000 or not rate*.15 <= len(samples) <= rate*.6:
        raise ValueError('Require bounded onset search')
    size=round(rate*.002)
    blocks=samples[:len(samples)//size*size].reshape(-1,size,2)
    rms=np.sqrt(np.mean(blocks**2,axis=(1,2)))
    peak=float(np.max(rms))
    if peak <= 1e-6:
        raise ValueError('No usable onset energy')
    threshold=peak*.12
    # Sixteen quiet milliseconds followed by at least 75 percent above
    # threshold over24ms; short low-frequency zero crossings are not new notes.
    candidates=[i for i in range(8,len(rms)-12)
        if np.all(rms[i-8:i]<threshold) and rms[i]>=threshold
        and np.count_nonzero(rms[i:i+12]>=threshold)>=9]
    if len(candidates)!=1:
        raise ValueError('Require one unambiguous quiet-to-energy onset')
    return dict(onsetFrame=candidates[0]*size,rate=rate,blockFrames=size,
        threshold=threshold,peakBlockRms=peak,sourceAttackVerified=False,
        scope='Energy onset bracket only; no source-isolation, MIDI pitch or musical attack approval')


if __name__=='__main__':
    source,start,seconds=sys.argv[1:]
    start,seconds=map(float,[start,seconds])
    if not np.isfinite(start) or start<0 or not .15<=seconds<=.6:
        raise ValueError('Require explicit bounded source search')
    rate=16000
    raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',source,
        '-t',str(seconds),'-ar',str(rate),'-ac','2','-f','f32le','pipe:1'])
    samples=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
    if len(samples)!=round(seconds*rate):
        raise ValueError('Incomplete source search')
    result=quiet_onset(samples,rate)
    print(json.dumps(dict(result,source=source,searchStart=start,
        estimatedOnsetSeconds=start+result['onsetFrame']/rate)))
