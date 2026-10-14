"""Bounded source-note evolution evidence. Not clean separation/listening approval."""
import json
import subprocess
import sys
import numpy as np


def motion_fit(samples, rate, hz, harmonics=16):
    if samples.ndim != 2 or samples.shape[1] != 2 or not np.all(np.isfinite(samples)):
        raise ValueError('Require finite stereo')
    if not isinstance(harmonics,int) or not 1 <= harmonics <= 32 or not 8000 <= rate <= 96000 or not 20 < hz < rate/(2*harmonics):
        raise ValueError('Invalid analysis layout')
    window = round(rate*max(.04, 4/hz))
    hop = round(rate*.01)
    if len(samples) < window+2*hop or len(samples) > rate*.6:
        raise ValueError('Require bounded multi-window note')
    time = np.arange(len(samples))/rate
    matrix = np.column_stack([np.ones(len(time))]+[
        fn(2*np.pi*hz*h*time) for h in range(1, harmonics+1) for fn in [np.sin, np.cos]])
    voiced = samples-np.mean(samples, axis=0)
    energy = float(np.sum(voiced**2))
    if energy <= 1e-10:
        raise ValueError('No voiced evidence')
    static = np.linalg.lstsq(matrix, samples, rcond=None)[0]
    windows = []
    for start in range(0, len(samples)-window+1, hop):
        end = start+window
        local = samples[start:end]
        local_energy = float(np.sum((local-np.mean(local,axis=0))**2))
        if local_energy <= 1e-12:
            continue
        coefficients = np.linalg.lstsq(matrix[start:end], local, rcond=None)[0]
        error = local-matrix[start:end]@coefficients
        amplitudes = np.hypot(coefficients[1::2], coefficients[2::2])
        windows.append(dict(centerFrame=(start+end-1)/2,
            residual=float(np.sum(error**2)/local_energy),
            amplitudes=amplitudes.tolist(), rms=float(np.sqrt(np.mean(local**2)))))
    if len(windows) < 3:
        raise ValueError('Insufficient voiced windows')
    # Keep fixed source-derived phases: magnitude evolution cannot add a new
    # pitch glide merely because independent fit phases drift between windows.
    phase = np.arctan2(static[2::2], static[1::2])
    dynamic = np.zeros_like(samples)
    centers = np.array([w['centerFrame'] for w in windows])
    values = np.array([w['amplitudes'] for w in windows])
    for h in range(harmonics):
        for channel in range(2):
            amplitude = np.interp(np.arange(len(samples)),centers,values[:,h,channel])
            dynamic[:,channel] += amplitude*np.sin(2*np.pi*hz*(h+1)*time+phase[h,channel])
    static_error = float(np.sum((samples-matrix@static)**2)/energy)
    dynamic_error = float(np.sum((voiced-dynamic)**2)/energy)
    return dict(rate=rate, frames=len(samples), fundamentalHz=hz, harmonics=harmonics,
        windowFrames=window, hopFrames=hop, windows=windows,
        staticResidual=static_error, dynamicResidual=dynamic_error,
        phaseRadians=phase.tolist(),
        maxWindowResidual=max(w['residual'] for w in windows),
        cleanSeparationVerified=False, heldOutNoteVerified=False, sunoCharacterVerified=False,
        scope='Within-sample harmonic magnitude evolution, fixed phase; no source attack/release identification, held-out generalization or audible approval')


if __name__ == '__main__':
    source,start,seconds,hz=sys.argv[1:]
    start,seconds,hz=map(float,[start,seconds,hz])
    if not np.isfinite(start) or start < 0 or not .08 <= seconds <= .6:
        raise ValueError('Require explicit bounded interval')
    rate=48000
    raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',source,
        '-t',str(seconds),'-ar',str(rate),'-ac','2','-f','f32le','pipe:1'])
    samples=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
    if len(samples)!=round(seconds*rate):
        raise ValueError('Incomplete source interval')
    print(json.dumps(dict(motion_fit(samples,rate,hz),source=source,sourceStart=start)))
