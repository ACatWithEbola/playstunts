"""Audit estimated stems against their exact separator input; optional residual.
Run in isolated Demucs environment. Original voice identities are unverified.
"""
import json,sys,subprocess
from pathlib import Path
import torch,sphn
from demucs.audio import convert_audio
source,folder=map(Path,sys.argv[1:3])
names=['bass','drums','guitar','other','piano','vocals']
stems=[]
rate=None
for name in names:
    samples,sr=sphn.read(str(folder/(name+'.wav')))
    if rate is None: rate=int(sr)
    assert int(sr)==rate and samples.shape[0]==2
    stems.append(torch.from_numpy(samples))
samples,sr=sphn.read(str(source))
original=convert_audio(torch.from_numpy(samples),int(sr),rate,2)
assert all(stem.shape==original.shape for stem in stems)
assert all(torch.isfinite(stem).all() for stem in stems)
summed=torch.stack(stems).sum(0)
residual=original-summed
relative=float((residual.square().mean()/original.square().mean()).sqrt())
error=float((summed+residual-original).abs().max())
assert error<1e-6
if len(sys.argv)>3:
    output=Path(sys.argv[3])
    assert not output.exists() and output.resolve()!=source.resolve()
    subprocess.run(['ffmpeg','-v','error','-n','-f','f32le','-ar',str(rate),'-ac','2','-i','pipe:0','-c:a','pcm_f32le',str(output)],input=residual.T.contiguous().numpy().tobytes(),check=True)
print(json.dumps({'stemCount':len(stems),'sampleRate':rate,'samples':original.shape[-1],'relativeResidualRms':relative,'recombinedWithResidualMaxError':error,'originalInstrumentIdentityVerified':False}))
