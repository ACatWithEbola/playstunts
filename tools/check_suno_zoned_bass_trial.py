"""Independent PCM/event check plus held-out sustained spectra, not listening."""
import hashlib
import json
import pathlib
import subprocess
import sys
import numpy as np
from inspect_suno_spectral_motion import motion_fit

folder=pathlib.Path(sys.argv[1])
evidence=json.loads((folder/'manifest.json').read_text())
digest=lambda path:hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
assert digest(evidence['source'])==evidence['sourceHash']
assert digest(evidence['baseManifest'])==evidence['baseManifestHash']
base=json.loads(pathlib.Path(evidence['baseManifest']).read_text())
rate=evidence['rate']
end=evidence['frames']*evidence['sourceRate']//rate
original=[]
for note in base['plan']['notes']:
    if note['startFrame']>=end:
        continue
    copy=dict(note)
    if copy['releaseFrame']>end:
        copy['releaseFrame']=end
        copy['windowTruncated']=True
        copy.pop('retriggerAbortFrame',None)
    original.append(copy)
assert evidence['notes']==original, 'Candidate notes must match retained original schedule'
for zone in evidence['zones']:
    if 'sourceEstimatedMidi' in zone:
        assert zone['pitch']-zone['sourceEstimatedMidi']==zone['sourceToScoreSelectionOffset']==12
        estimated=69+12*np.log2(zone['model']['model']['fundamentalHz']/440)
        assert abs(estimated-zone['sourceEstimatedMidi'])<.1
expected=np.zeros((evidence['frames'],2))
for note,event,assignment in zip(evidence['notes'],evidence['events'],evidence['assignments'],strict=True):
    for key,value in note.items():
        assert event[key]==value
    start=int(np.floor(note['startFrame']*rate/evidence['sourceRate']+.5))
    release=int(np.floor(note['releaseFrame']*rate/evidence['sourceRate']+.5))
    tail=round(rate*(.002 if 'retriggerAbortFrame' in note else .02))
    assert event['outputStartFrame']==start and event['outputReleaseFrame']==release
    hz=440*2**((note['pitch']-69)/12)
    assert event['frequencyHz']==hz
    zone=min(evidence['zones'],key=lambda item:(abs(item['pitch']-note['pitch']),item['pitch']))
    assert zone['pitch']==assignment['sourceZonePitch']
    coeff=np.array(zone['coefficients'])
    at=np.arange(start,min(evidence['frames'],release+tail))
    time=(at-start)/rate
    envelope=np.minimum(1,time/.005)*np.where(at<release,1,np.maximum(0,1-(at-release)/tail))*note['velocity']/127
    if note.get('windowTruncated'):
        envelope*=np.minimum(1,(evidence['frames']-at)/(rate*.01))
    signal=np.zeros((len(at),2))
    for harmonic in range(1,(len(coeff)-1)//2+1):
        phase=2*np.pi*hz*harmonic*time
        signal+=np.sin(phase)[:,None]*coeff[2*harmonic-1]+np.cos(phase)[:,None]*coeff[2*harmonic]
    expected[at]+=signal*envelope[:,None]
wav=folder/'zoned.wav'
assert digest(wav)==evidence['outputHashes']['zoned']
actual=np.frombuffer(wav.read_bytes(),dtype='<f4',offset=44).reshape(-1,2)
assert actual.shape==expected.shape and np.all(np.isfinite(actual))
maximum=float(np.max(np.abs(actual-expected)))
assert maximum<1e-6
results=[]
for start,hz,pitch in [(.78,41.30735531879901,28),(9.69,41.439512218735615,28),(14.68,55.18165027240372,33)]:
    raw=subprocess.check_output(['ffmpeg','-v','error','-ss',str(start),'-i',evidence['source'],'-t','0.21','-ar','48000','-ac','2','-f','f32le','pipe:1'])
    measured=motion_fit(np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float),48000,hz,32)
    magnitudes=np.array([window['amplitudes'] for window in measured['windows']])
    def error(coeff):
        coeff=np.array(coeff)
        model=np.hypot(coeff[1::2],coeff[2::2])[None,:,:]
        gain=float(np.sum(magnitudes*model)/(len(magnitudes)*np.sum(model**2)))
        return float(np.sum((magnitudes-gain*model)**2)/np.sum(magnitudes**2))
    zone=next(zone for zone in evidence['zones'] if zone.get('sourceEstimatedMidi',zone['pitch'])==pitch)
    results.append(dict(heldOutStart=start,pitch=pitch,baseline=error(base['model']['model']['stereoCoefficients']),zoned=error(zone['coefficients']),sourceMaxWindowResidual=measured['maxWindowResidual']))
usage={zone['pitch']:sum(item['sourceZonePitch']==zone['pitch'] for item in evidence['assignments']) for zone in evidence['zones']}
print(json.dumps(dict(notes=len(evidence['notes']),zoneUsage=usage,maxPcmError=maximum,heldOutSustainedMagnitudes=results,sunoCharacterVerified=False,scope='Independent samples/events and32-harmonic sustained magnitude comparison; not attack/envelope/phase/listening acceptance')))
