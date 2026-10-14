"""Compare bounded RMS note edges, not perceptual timing approval."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path
import numpy as np

paths = sys.argv[1:4]
before = [hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in paths]
manifest = json.loads(Path(paths[0]).read_text())
rate = 32000
def decode(path):
    return np.frombuffer(subprocess.check_output([
        'ffmpeg', '-v', 'error', '-i', path, '-ar', str(rate),
        '-ac', '2', '-f', 'f32le', 'pipe:1']), dtype='<f4').reshape(-1, 2)
original, candidate = map(decode, paths[1:])
notes = manifest['events']
reports = []
for index, note in enumerate(notes):
    start, end = note['startFrame'], note['releaseFrame']
    next_start = notes[index+1]['startFrame'] if index+1 < len(notes) else end+3200
    limit = min(end+3200, next_start, len(original), len(candidate))
    if start >= len(original) or end > len(original):
        continue
    def edges(pcm):
        segment = pcm[start:limit].astype(float)
        block = 32  #1ms, no signed stereo cancellation
        energy = np.array([np.mean(segment[i:i+block]**2)
                           for i in range(0, len(segment), block)])
        peak = float(np.max(energy))
        if peak <= 0:
            raise ValueError('Silent note comparison')
        active = np.flatnonzero(energy >= peak*.01)
        return dict(onsetMs=float(active[0]),
                    lastActiveMs=float(active[-1]+1),
                    trailingWindowMs=(limit-end)/32)
    a, b = edges(original), edges(candidate)
    reports.append(dict(pitch=note['pitch'], startFrame=start,
                        original=a, candidate=b,
                        onsetDifferenceMs=b['onsetMs']-a['onsetMs'],
                        endingDifferenceMs=b['lastActiveMs']-a['lastActiveMs']))
if before != [hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in paths]:
    raise ValueError('Input changed')
print(json.dumps(dict(inputHashes=before, notesCompared=len(reports), notes=reports,
    approvedForGame=False, scope='1ms RMS blocks, threshold at1percent of local peak energy; adjacent notes limit release observation. Not audible attack/release approval.')))
