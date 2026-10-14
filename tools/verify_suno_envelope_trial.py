"""Independent NumPy reconstruction of the bounded bass-envelope experiment."""
import hashlib
import json
import pathlib
import struct
import sys
import numpy as np

folder=pathlib.Path(sys.argv[1])
evidence=json.loads((folder/'manifest.json').read_text())
digest=lambda path: hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()
assert digest(evidence['source'])==evidence['sourceHash']
assert digest(evidence['baseManifest'])==evidence['baseManifestHash']
base=json.loads(pathlib.Path(evidence['baseManifest']).read_text())
rate,source_rate,frames=evidence['rate'],evidence['sourceRate'],evidence['frames']
assert (rate,source_rate,frames)==(48000,32000,480000)
assert evidence['approvedForGame'] is False and evidence['sunoCharacterVerified'] is False
notes=[dict(note) for note in base['plan']['notes'] if note['startFrame']<320000]
for note in notes:
    if note['releaseFrame']>320000:
        note['releaseFrame']=320000
        note['windowTruncated']=True
        note.pop('retriggerAbortFrame',None)
assert len(notes)==len(evidence['events'])
coeff=np.array(base['model']['model']['stereoCoefficients'])
profile=evidence['envelope']
errors={}
for name in ['baseline','source-envelope']:
    raw=(folder/(name+'.wav')).read_bytes()
    assert raw[:4]==b'RIFF' and raw[8:16]==b'WAVEfmt '
    assert struct.unpack_from('<HHI',raw,20)==(3,2,rate)
    assert raw[36:40]==b'data' and struct.unpack_from('<I',raw,40)[0]==frames*8
    pcm=np.frombuffer(raw[44:],dtype='<f4').reshape(-1,2)
    assert pcm.shape==(frames,2) and np.isfinite(pcm).all() and np.max(np.abs(pcm))<1
    expected=np.zeros((frames,2))
    for note,event in zip(notes,evidence['events']):
        for key in ['pitch','velocity','startFrame','releaseFrame']:
            assert note[key]==event[key]
        start=int(np.floor(note['startFrame']*rate/source_rate+.5))
        release=int(np.floor(note['releaseFrame']*rate/source_rate+.5))
        tail=round(rate*(.02 if 'retriggerAbortFrame' not in note else .002))
        assert (event['outputStartFrame'],event['outputReleaseFrame'],event['tailFrames'])==(start,release,tail)
        at=np.arange(start,min(frames,release+tail))
        elapsed=(at-start)/rate
        frequency=440*2**((note['pitch']-69)/12)
        assert abs(event['frequencyHz']-frequency)<1e-12
        tone=np.zeros((len(at),2))
        for harmonic in range(1,(len(coeff)+1)//2):
            phase=2*np.pi*frequency*harmonic*elapsed
            tone+=np.sin(phase)[:,None]*coeff[2*harmonic-1]+np.cos(phase)[:,None]*coeff[2*harmonic]
        attack=np.minimum(1,elapsed/.005) if name=='baseline' else np.interp(elapsed,[p['seconds'] for p in profile],[p['gain'] for p in profile])
        gain=attack*np.where(at<release,1,np.maximum(0,1-(at-release)/tail))*note['velocity']/127
        if note.get('windowTruncated'):
            gain*=np.minimum(1,(frames-at)/(rate*.01))
        expected[at]+=tone*gain[:,None]
    error=float(np.max(np.abs(pcm-expected)))
    assert error<2e-6,(name,error)
    errors[name]=error
print(json.dumps(dict(notes=len(notes),frames=frames,maxSampleErrors=errors,
    inputHashesVerified=True,originalScheduleRetained=True,sunoCharacterVerified=False)))
