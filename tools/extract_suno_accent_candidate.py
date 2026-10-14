"""Explicit offline residual candidate; never overwrite or promote assets."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path
import numpy as np
from soft_percussive_separation import split_percussive
from percussion_accent_features import accent_features

source, destination = map(Path, sys.argv[1:3])
if not source.is_absolute() or not destination.is_absolute() or destination.exists():
    raise ValueError('Absolute source and NEW output directory required')
source=source.resolve(strict=True)
physical=destination.parent.resolve(strict=True)/destination.name
public=Path('public').resolve(strict=True)
if physical==public or public in physical.parents:
    raise ValueError('Not a public asset')
digest=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
before=digest(source)
rate=16000
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),
    '-ss','22.75','-t','1.5','-af','highpass=f=180','-ar',str(rate),
    '-ac','2','-f','f32le','pipe:1'])
pcm=np.frombuffer(raw,dtype='<f4').reshape(-1,2).astype(float)
if len(pcm)!=24000:
    raise ValueError('Incomplete source interval')
percussive,harmonic=split_percussive(pcm)
error=float(np.max(abs(percussive+harmonic-pcm)))
if error>1e-10:
    raise ValueError('Separation reconstruction failed')
crop=percussive[1920:17920].copy()
metrics=accent_features(crop,crop,rate)
fade=np.minimum(1,np.minimum(np.arange(rate)/32,(rate-1-np.arange(rate))/320))
crop*=fade[:,None]
if not np.all(np.isfinite(crop)) or np.max(abs(crop))>=1 or np.sum(crop*crop)<=1e-12:
    raise ValueError('Invalid residual sample')
if digest(source)!=before:
    raise ValueError('Source changed')
destination.mkdir()
output=destination/'accent-candidate.wav'
subprocess.run(['ffmpeg','-v','error','-n','-f','f32le','-ar',str(rate),
    '-ac','2','-i','pipe:0','-c:a','pcm_f32le',str(output)],
    input=crop.astype('<f4').tobytes(),check=True)
manifest=dict(kind='suno-percussive-residual',source=str(source),sourceSha256=before,
    sourceWindow=dict(start=22.75,seconds=1.5,highpassHz=180),
    cropSourceStart=22.87,cropSeconds=1,rate=rate,
    method=dict(window=2048,hop=256,kernel=17,boundaryFadeMs=[2,20]),
    outputFile=output.name,outputSha256=digest(output),
    reconstructionMaxError=error,bodyDiagnosticsBeforeBoundaryFade=metrics,
    approvedForGame=False,drumIdentityVerified=False,cleanSeparationVerified=False)
(destination/'manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(dict(destination=str(destination),outputSha256=manifest['outputSha256'],
    approvedForGame=False)))
