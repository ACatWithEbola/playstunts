"""Read-only transient inventory; spectral bands do not establish drum identity."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path
import numpy as np

def inspect(pcm, rate, detection_pcm=None):
    if pcm.ndim != 2 or pcm.shape[1] != 2 or not np.all(np.isfinite(pcm)):
        raise ValueError('Finite stereo PCM required')
    hop = rate // 200
    detection = pcm if detection_pcm is None else detection_pcm
    if detection.shape != pcm.shape or not np.all(np.isfinite(detection)):
        raise ValueError('Detection PCM must match original stereo layout')
    energy = np.array([np.mean(detection[i:i+hop]**2) for i in range(0, len(pcm)-hop, hop)])
    rise = np.maximum(0, np.diff(energy, prepend=0))
    if len(rise) < 3 or np.max(rise) <= 1e-12:
        raise ValueError('No transient evidence')
    candidates = []
    for i in range(1, len(rise)-1):
        if rise[i] < np.max(rise)*.1 or not rise[i] >= rise[i-1] or not rise[i] > rise[i+1]:
            continue
        at = i*hop
        if candidates and at-candidates[-1]['frame'] < rate*.035:
            if rise[i] <= candidates[-1]['rise']:
                continue
            candidates.pop()
        candidates.append(dict(frame=at, rise=float(rise[i])))
    for index, candidate in enumerate(candidates):
        at = candidate['frame']
        block = pcm[at:at+1024]
        if len(block) < 1024:
            candidate['bands'] = None
            continue
        power = np.mean(np.abs(np.fft.rfft(block*np.hanning(1024)[:, None], axis=0))**2, axis=1)
        frequencies = np.fft.rfftfreq(1024, 1/rate)
        total = np.sum(power[(frequencies >= 40) & (frequencies < rate/2)])
        candidate['bands'] = [float(np.sum(power[(frequencies >= low) & (frequencies < high)])/total) if total else 0 for low, high in [(40, 180), (180, 2000), (2000, rate/2)]]
        candidate['seconds'] = at/rate
        candidate['nextTransientSeconds'] = (candidates[index+1]['frame']-at)/rate if index+1 < len(candidates) else None
    return candidates

if __name__ == '__main__':
    source = Path(sys.argv[1]).resolve(strict=True)
    before = hashlib.sha256(source.read_bytes()).hexdigest()
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(source), '-t', '60', '-ar', '16000', '-ac', '2', '-f', 'f32le', 'pipe:1'])
    pcm = np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(float)
    high_detection = '--high-transients' in sys.argv[2:]
    detection = None
    if high_detection:
        filtered = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(source),
            '-t', '60', '-af', 'highpass=f=2000', '-ar', '16000', '-ac', '2',
            '-f', 'f32le', 'pipe:1'])
        detection = np.frombuffer(filtered, dtype='<f4').reshape(-1, 2).astype(float)
    candidates = inspect(pcm, 16000, detection)
    eligible = [candidate for candidate in candidates if candidate['bands'] is not None and candidate['nextTransientSeconds'] is not None and candidate['nextTransientSeconds'] >= .065]
    ranked = [[*sorted(eligible, key=lambda candidate: candidate['bands'][band], reverse=True)[:3]] for band in range(3)]
    assert hashlib.sha256(source.read_bytes()).hexdigest() == before
    print(json.dumps(dict(sourceSha256=before, detectionHighpassHz=2000 if high_detection else None, spectralBandsMeasuredOn='unfiltered source', transients=len(candidates), eligibleWindows=len(eligible), bandRangesHz=[[40,180],[180,2000],[2000,8000]], candidatesByBand=ranked, drumIdentitiesVerified=False, cleanSeparationVerified=False)))
