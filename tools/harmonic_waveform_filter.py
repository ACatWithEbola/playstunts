"""Experimental shared stereo harmonic mask; never a clean-source certificate."""
import numpy as np

def harmonic_filter(samples, rate, fundamental, width_hz=18, harmonics=32):
    if samples.ndim!=2 or samples.shape[1]!=2 or len(samples)<512:
        raise ValueError('Require finite stereo sample')
    if not np.all(np.isfinite(samples)) or np.sum(samples*samples)<=1e-12:
        raise ValueError('Require voiced input')
    if not 8000<=rate<=192000 or not 20<fundamental<rate/2 or not 0<width_hz<fundamental/2 or not 1<=harmonics<=64:
        raise ValueError('Invalid harmonic mask')
    frequencies=np.fft.rfftfreq(len(samples),1/rate)
    mask=np.zeros(len(frequencies))
    for h in range(1,harmonics+1):
        center=fundamental*h
        if center>=rate/2:
            break
        # Raised cosine, identical mask for both complex stereo spectra.
        distance=np.abs(frequencies-center)/width_hz
        mask=np.maximum(mask,np.where(distance<1,.5+.5*np.cos(np.pi*np.minimum(distance,1)),0))
    result=np.fft.irfft(np.fft.rfft(samples,axis=0)*mask[:,None],n=len(samples),axis=0)
    return result

if __name__=='__main__':
    import json
    import subprocess
    import sys
    from analyze_bass_sample_harmonics import fit
    source=sys.argv[1]
    rate=48000
    raw=subprocess.check_output(['ffmpeg','-v','error','-ss','5.08','-t','0.08',
        '-i',source,'-ar',str(rate),'-ac','2','-f','f32le','pipe:1'])
    samples=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
    if len(samples)!=3840:
        raise ValueError('Incomplete source interval')
    fundamental=165.325
    filtered=harmonic_filter(samples,rate,fundamental)
    if '--raw' in sys.argv[2:]:
        sys.stdout.buffer.write(filtered.astype('<f4').tobytes())
        sys.exit(0)
    # Same bounded eight-harmonic diagnostic on input and output; retained
    # upper harmonics/noise can still contribute to this residual.
    reports=[fit(x,rate,155,175,.025) for x in [samples,filtered]]
    print(json.dumps(dict(source=source,startSeconds=5.08,seconds=.08,
        fundamentalHz=fundamental,widthHz=18,harmonics=32,
        retainedEnergyFraction=float(np.sum(filtered**2)/np.sum(samples**2)),
        beforeResidual=reports[0]['residualEnergyFraction'],
        afterResidual=reports[1]['residualEnergyFraction'],
        beforeHz=reports[0]['fundamentalHz'],afterHz=reports[1]['fundamentalHz'],
        approvedForGame=False,cleanSeparationVerified=False,
        scope='Offline masked-source diagnostic only; harmonic leakage, attack and Suno character unverified')))
