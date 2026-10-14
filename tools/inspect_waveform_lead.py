"""Read-only pitch stability report; no musical acceptance inferred."""
import json
import math
import subprocess
import sys
from pathlib import Path
import numpy as np
from analyze_bass_sample_harmonics import fit

m = json.loads(Path(sys.argv[1]).read_text())
ordered = sorted(m['events'], key=lambda e:e['startFrame'])
latest_release = -1
for event in ordered:
    if event['startFrame'] < latest_release:
        raise ValueError('Polyphonic layer requires joint chord analysis, not a single-note pitch estimate')
    latest_release = max(latest_release, event['releaseFrame'])
rate = 32000
pcm = np.frombuffer(subprocess.check_output([
    'ffmpeg', '-v', 'error', '-i', sys.argv[2], '-ar', str(rate),
    '-ac', '2', '-f', 'f32le', 'pipe:1']), dtype='<f4').reshape(-1, 2)
results = []
short_notes = 0
short_estimates = []
for event in m['events']:
    start = event['startFrame'] + 800
    end = min(start + 1600, event['releaseFrame'] - 160)
    if end - start < 400:
        if '--inspect-short-windows' in sys.argv[3:]:
            start = event['startFrame'] + 64
            end = event['releaseFrame'] - 64
            if end-start < 400:
                raise ValueError('Short-note diagnostic window too small')
            expected = 440*2**((event['pitch']-69)/12)
            estimate = fit(pcm[start:end].astype(float), rate,
                           expected*2**(-2/12), expected*2**(2/12), .1)
            short_estimates.append(dict(pitch=event['pitch'], milliseconds=(end-start)/32,
                cents=1200*math.log2(estimate['fundamentalHz']/expected),
                residual=estimate['residualEnergyFraction']))
        if '--report-short-notes' not in sys.argv[3:]:
            raise ValueError('Insufficient isolated note window')
        short_notes += 1
        continue
    expected = 440 * 2 ** ((event['pitch'] - 69) / 12)
    result = fit(pcm[start:end].astype(float), rate,
                 expected * 2**(-2/12), expected * 2**(2/12), .1)
    cents = 1200 * math.log2(result['fundamentalHz'] / expected)
    results.append(dict(pitch=event['pitch'], startFrame=event['startFrame'],
                        releaseFrame=event['releaseFrame'], cents=cents,
                        residual=result['residualEnergyFraction']))
print(json.dumps(dict(notes=len(results),
    shortNotesUnmeasured=short_notes, totalNotes=len(m['events']),
    maxAbsoluteCents=max(abs(n['cents']) for n in results),
    medianAbsoluteCents=float(np.median([abs(n['cents']) for n in results])),
    maxResidual=max(n['residual'] for n in results),
    notesOutsideFiveCents=sum(abs(n['cents']) > 5 for n in results),
    nearestSemitoneMismatches=sum(abs(n['cents']) >= 50 for n in results),
    mismatchDetails=[n for n in results if abs(n['cents']) >= 50],
    shortWindowDiagnostics=dict(count=len(short_estimates),
        nearestSemitoneMismatches=sum(abs(n['cents']) >= 50 for n in short_estimates),
        maxAbsoluteCents=max((abs(n['cents']) for n in short_estimates), default=None),
        maxResidual=max((n['residual'] for n in short_estimates), default=None),
        accepted=False),
    approvedForGame=False,
    scope='Sustained harmonic fit searches plus/minus two semitones; five-cent count is descriptive, not a user requirement. Leakage, attacks, releases and retained Suno character not verified')))
