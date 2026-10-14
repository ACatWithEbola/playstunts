"""Measure candidate PCM pitch, separately from scheduled note metadata."""
import json
import subprocess
import sys
from pathlib import Path
import numpy as np
from analyze_bass_sample_harmonics import fit

manifest = json.loads(Path(sys.argv[1]).read_text())
rate = 32000
raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', sys.argv[2],
    '-ar', str(rate), '-ac', '2', '-f', 'f32le', 'pipe:1'])
pcm = np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(float)
checked = []
short_notes = []
for event in manifest['events']:
    start = event['startFrame'] + 640
    end = min(start + 1600, event['releaseFrame'] - 160)
    if end - start < 400:
        if '--report-short-notes' not in sys.argv[3:]:
            raise ValueError('No isolated sustained pitch window')
        short_notes.append(dict(pitch=event['pitch'], startFrame=event['startFrame'], releaseFrame=event['releaseFrame']))
        continue
    expected = 440 * 2 ** ((event['pitch'] - 69) / 12)
    result = fit(pcm[start:end], rate, expected - 5, expected + 5, .25)
    if abs(result['fundamentalHz'] - expected) > .3 or result['residualEnergyFraction'] > .02:
        raise ValueError('Candidate PCM pitch does not match scheduled note')
    checked.append(dict(pitch=event['pitch'], expectedHz=expected,
        measuredHz=result['fundamentalHz'], residual=result['residualEnergyFraction']))
print(json.dumps(dict(noteCount=len(checked),
    totalNotes=len(manifest['events']), shortNotesUnmeasured=len(short_notes),
    allNotesMeasured=not short_notes,
    maxPitchErrorHz=max((abs(note['measuredHz']-note['expectedHz']) for note in checked), default=None),
    maxResidual=max((note['residual'] for note in checked), default=None),
    **(dict(notes=checked) if '--details' in sys.argv[3:] else {}), audibleCharacterApproved=False,
    scope='Sustained PCM pitch only; does not prove attack/release timing or full remix fidelity')))
