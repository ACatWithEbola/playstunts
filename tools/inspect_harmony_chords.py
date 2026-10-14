"""Read-only stable-chord spectral evidence, not audible acceptance."""
import json
import subprocess
import sys
from pathlib import Path
import numpy as np
from joint_harmonic_templates import joint_templates

def inspect(pcm, rate, events, harmonics=8):
    # Split at every attack/release; avoid attack and provisional release tails.
    edges = sorted({0, len(pcm)} | {round(e[k]*rate/32000)
        for e in events for k in ['startFrame', 'releaseFrame']})
    measured, skipped = [], []
    for left, right in zip(edges, edges[1:]):
        start = left+round(rate*.025)
        end = min(right-round(rate*.005), start+round(rate*.1))
        if end-start < round(rate*.05):
            continue
        pitches = sorted({e['pitch'] for e in events
            if e['startFrame']*rate/32000 <= left
            and e['releaseFrame']*rate/32000 >= right})
        if not pitches:
            continue
        frequencies = [440*2**((p-69)/12) for p in pitches]
        try:
            model = joint_templates(pcm[start:end], rate, frequencies, harmonics)
        except ValueError as error:
            skipped.append(dict(startSeconds=start/rate, pitches=pitches, reason=str(error)))
            continue
        energies = [float(np.sum(np.asarray(m['stereoCoefficients'])[1:]**2))
            for m in model['models']]
        measured.append(dict(startSeconds=start/rate, pitches=pitches,
            residual=model['residualEnergyFraction'], condition=model['condition'],
            voiceEnergies=energies))
    return dict(windows=len(measured), harmonics=harmonics, skippedWindows=skipped,
        maxResidual=max((m['residual'] for m in measured), default=None),
        questionable=[m for m in measured if m['residual']>.01 or min(m['voiceEnergies'])<1e-10],
        approvedForGame=False,
        scope='Joint expected-pitch spectral fits in stable windows only; not onset, short-note, timbre or audible fidelity approval')

if __name__ == '__main__':
    manifest=json.loads(Path(sys.argv[1]).read_text())
    rate=32000
    pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',sys.argv[2],
        '-ar',str(rate),'-ac','2','-f','f32le','pipe:1']),dtype='<f4').reshape(-1,2).astype(float)
    options=[v for v in sys.argv[3:] if v.startswith('--harmonics=')]
    if len(options)>1:
        raise ValueError('Duplicate harmonic option')
    harmonics=int(options[0].split('=')[1]) if options else 8
    print(json.dumps(inspect(pcm,rate,manifest['events'],harmonics)))
