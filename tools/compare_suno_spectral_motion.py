"""Held-out note magnitude comparison, not phase/timing/listening acceptance."""
import json
import subprocess
import sys
import numpy as np
from inspect_suno_spectral_motion import motion_fit


def compare_motion(training, held_out):
    if training['harmonics'] != held_out['harmonics']:
        raise ValueError('Harmonic layouts differ')
    train_times=np.array([w['centerFrame']/training['rate'] for w in training['windows']])
    test_times=np.array([w['centerFrame']/held_out['rate'] for w in held_out['windows']])
    train=np.array([w['amplitudes'] for w in training['windows']])
    actual=np.array([w['amplitudes'] for w in held_out['windows']])
    predicted=np.empty_like(actual)
    for harmonic in range(train.shape[1]):
        for channel in range(2):
            predicted[:,harmonic,channel]=np.interp(test_times,train_times,train[:,harmonic,channel])
    static=np.broadcast_to(np.mean(train,axis=0),actual.shape)
    # Test a lower-complexity alternative: retain one spectral shape and learn
    # only its overall note envelope. Do not fit this model to the held-out note.
    train_energy=np.sqrt(np.sum(train**2,axis=(1,2)))
    shape=np.mean(train,axis=0)
    shape_norm=float(np.sqrt(np.sum(shape**2)))
    if shape_norm<=1e-12:
        raise ValueError('No usable spectral shape')
    envelope=np.interp(test_times,train_times,train_energy)
    amplitude_only=envelope[:,None,None]*(shape/shape_norm)[None,:,:]
    def error(model):
        denominator=float(np.sum(model**2))
        energy=float(np.sum(actual**2))
        if denominator<=1e-12 or energy<=1e-12:
            raise ValueError('No usable harmonic energy')
        # One overall loudness fit, not independent per-frame normalization.
        gain=float(np.sum(model*actual)/denominator)
        return dict(globalGain=gain,normalizedSquaredError=float(np.sum((actual-gain*model)**2)/energy))
    return dict(dynamic=error(predicted),static=error(static),amplitudeOnly=error(amplitude_only),
        trainingMaxWindowResidual=training['maxWindowResidual'],
        heldOutMaxWindowResidual=held_out['maxWindowResidual'],
        sourceAttackVerified=False,sunoCharacterVerified=False,
        scope='One held-out note magnitude trajectory at its estimated fundamental; one global gain, no phase or audible acceptance')


if __name__=='__main__':
    source,train_start,test_start,seconds,train_hz,test_hz=sys.argv[1:]
    train_start,test_start,seconds,train_hz,test_hz=map(float,[train_start,test_start,seconds,train_hz,test_hz])
    if not .12<=seconds<=.6 or min(train_start,test_start)<0 or abs(train_start-test_start)<seconds:
        raise ValueError('Require nonoverlapping bounded source notes')
    def load(start,hz):
        raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',source,
            '-t',str(seconds),'-ar','48000','-ac','2','-f','f32le','pipe:1'])
        samples=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
        if len(samples)!=round(seconds*48000):
            raise ValueError('Incomplete source interval')
        return motion_fit(samples,48000,hz)
    print(json.dumps(dict(compare_motion(load(train_start,train_hz),load(test_start,test_hz)),
        trainingStart=train_start,heldOutStart=test_start,seconds=seconds,source=source)))
