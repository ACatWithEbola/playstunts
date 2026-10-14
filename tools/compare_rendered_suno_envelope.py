"""Actual candidate template vs held-out source magnitudes; not listening proof."""
import hashlib
import json
import pathlib
import subprocess
import sys
import numpy as np
from inspect_suno_spectral_motion import motion_fit

folder,onset,hz=sys.argv[1:]
onset,hz=map(float,[onset,hz])
if not np.isfinite(onset) or onset<.04 or not 20<hz<500:
    raise ValueError('Require explicit held-out source onset/pitch')
evidence=json.loads((pathlib.Path(folder)/'manifest.json').read_text())
base=json.loads(pathlib.Path(evidence['baseManifest']).read_text())
digest=lambda path: hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
assert digest(evidence['source'])==evidence['sourceHash']
assert digest(evidence['baseManifest'])==evidence['baseManifestHash']
assert abs(onset-evidence['onset']['estimatedOnsetSeconds'])>=.35
coeff=np.array(base['model']['model']['stereoCoefficients'])
harmonics=(len(coeff)-1)//2
assert harmonics==32
rate=48000
context_seconds=.04
duration=.35
raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(onset-context_seconds),
    '-i',evidence['source'],'-t',str(duration+context_seconds),'-ar',str(rate),
    '-ac','2','-f','f32le','pipe:1'])
actual_pcm=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
assert len(actual_pcm)==round((duration+context_seconds)*rate)
actual=motion_fit(actual_pcm,rate,hz,harmonics)
time=np.arange(len(actual_pcm))/rate-context_seconds
tone=np.zeros_like(actual_pcm)
for harmonic in range(1,harmonics+1):
    phase=2*np.pi*hz*harmonic*time
    tone+=np.sin(phase)[:,None]*coeff[2*harmonic-1]+np.cos(phase)[:,None]*coeff[2*harmonic]
profile=evidence['envelope']
envelopes=dict(baseline=np.clip(time/.005,0,1),candidate=np.where(time<0,0,np.interp(time,[p['seconds'] for p in profile],[p['gain'] for p in profile])))
target=np.array([window['amplitudes'] for window in actual['windows']])
centers=np.array([window['centerFrame']/rate-context_seconds for window in actual['windows']])
whole=(centers>=0)&(centers<=duration)
early=(centers>=0)&(centers<=.08)
assert early.sum()>=3
results={}
attack=(time>=0)&(time<.08)
def attack_quantiles(pcm):
    energy=np.sum(pcm[attack]**2,axis=1)
    total=float(np.sum(energy))
    if not np.isfinite(total) or total<=1e-12:
        raise ValueError('No usable early attack energy')
    cumulative=np.cumsum(energy)/total
    return {str(fraction):float(np.searchsorted(cumulative,fraction)/rate*1000) for fraction in [.1,.5,.9]}
attack_metrics={'source':attack_quantiles(actual_pcm)}
for name,envelope in envelopes.items():
    modeled_pcm=tone*envelope[:,None]
    attack_metrics[name]=attack_quantiles(modeled_pcm)
    modeled=motion_fit(modeled_pcm,rate,hz,harmonics)
    values=np.array([window['amplitudes'] for window in modeled['windows']])
    assert values.shape==target.shape
    # Same analysis windows/support and one global gain across the whole note.
    gain=float(np.sum(values[whole]*target[whole])/np.sum(values[whole]**2))
    def error(mask):
        return float(np.sum((target[mask]-gain*values[mask])**2)/np.sum(target[mask]**2))
    results[name]=dict(globalGain=gain,wholeNoteMagnitudeError=error(whole),earlyWindowMagnitudeError=error(early))
print(json.dumps(dict(heldOutOnset=onset,hz=hz,harmonics=harmonics,preOnsetContextSeconds=context_seconds,
    analysisWindowSeconds=actual['windowFrames']/rate,earlyWindowCenters=centers[early].tolist(),
    results=results,attackEnergyQuantileMilliseconds=attack_metrics,
    pitchCycleMilliseconds=1000/hz,
    attackMetricScope='Cumulative stereo energy within first80ms after estimated threshold onset; gain invariant, sensitive to phase/source contamination, not perceived onset verification',
    sourceMaxWindowResidual=actual['maxWindowResidual'],sunoCharacterVerified=False,
    scope='Actual32-harmonic candidate coefficients/profile, same windowed magnitude analysis; early windows straddle attack boundaries, not sample-level attack or listening acceptance')))
