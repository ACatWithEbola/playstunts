"""Phase-aligned source-cycle average; offline timbre candidate only."""
import numpy as np

def cycle_coefficients(samples, rate, fundamental, harmonics=32):
    if samples.ndim!=2 or samples.shape[1]!=2 or not np.all(np.isfinite(samples)):
        raise ValueError('Require finite stereo')
    if not 20<fundamental<rate/2 or not 1<=harmonics<=32 or fundamental*harmonics>=rate/2:
        raise ValueError('Invalid cycle frequency/harmonics')
    period=rate/fundamental
    count=int((len(samples)-rate*.02)/period)
    if count<3 or np.sum(samples*samples)<=1e-12:
        raise ValueError('Insufficient voiced cycles')
    phase=np.arange(1024)/1024
    coordinates=np.arange(len(samples))
    cycles=[]
    for index in range(count):
        at=rate*.01+(index+phase)*period
        cycles.append(np.column_stack([np.interp(at,coordinates,samples[:,ch]) for ch in range(2)]))
    table=np.mean(cycles,axis=0)
    spectrum=np.fft.rfft(table,axis=0)/len(table)
    coefficients=[np.zeros(2)]
    for h in range(1,harmonics+1):
        coefficients.extend([-2*spectrum[h].imag,2*spectrum[h].real])
    return dict(stereoCoefficients=np.asarray(coefficients).tolist(),
        averagedCycles=count,sourceFundamentalHz=fundamental,harmonics=harmonics,
        approvedForGame=False,sunoCharacterVerified=False)

if __name__=='__main__':
    import json
    import subprocess
    import sys
    rate=48000
    start,seconds,fundamental=map(float,sys.argv[2:5]) if len(sys.argv)==5 else (5.08,.08,165.325)
    if len(sys.argv) not in [2,5] or not np.isfinite(start) or start<0 or not .05<=seconds<=.5:
        raise ValueError('Require explicit bounded source interval')
    raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),
        '-i',sys.argv[1],'-t',str(seconds),'-ar',str(rate),'-ac','2','-f','f32le','pipe:1'])
    samples=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
    if len(samples)!=round(rate*seconds):
        raise ValueError('Incomplete source interval')
    print(json.dumps(dict(cycle_coefficients(samples,rate,fundamental),sourceStart=start,sourceSeconds=seconds)))
