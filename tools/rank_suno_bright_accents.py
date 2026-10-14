"""Read-only one-second bright-accent inventory; ranking is not identity proof."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path
import numpy as np
from inspect_percussion_candidates import inspect
from percussion_accent_features import accent_features

rate = 16000
ranked = []
hashes = {}
for source_text in sys.argv[1:]:
    source = Path(source_text).resolve(strict=True)
    before = hashlib.sha256(source.read_bytes()).hexdigest()
    def decode(filtered):
        args = ['ffmpeg','-v','error','-i',str(source),'-t','60']
        if filtered:
            args += ['-af','highpass=f='+str(filtered)]
        return np.frombuffer(subprocess.check_output(args+[
            '-ar',str(rate),'-ac','2','-f','f32le','pipe:1']),
            dtype='<f4').reshape(-1,2).astype(float)
    original, high, body = decode(False), decode(2000), decode(180)
    candidates = inspect(original, rate, high)
    for event in candidates:
        at = event['frame']
        if not event.get('bands') or at+rate > len(high):
            continue
        segment = high[at:at+rate]
        power = np.sum(segment*segment, axis=1)
        total = float(np.sum(power))
        if total <= 1e-12:
            continue
        after100 = float(np.sum(power[rate//10:])/total)
        attack = original[at:at+1024]*np.hanning(1024)[:,None]
        spectrum = np.mean(abs(np.fft.rfft(attack,axis=0))**2,axis=1)
        spectrum = spectrum[np.fft.rfftfreq(1024,1/rate) >= 2000]
        flatness = float(np.exp(np.mean(np.log(spectrum+1e-20)))/(np.mean(spectrum)+1e-20))
        following = sum(at < other['frame'] < at+rate for other in candidates)
        gap = event['nextTransientSeconds'] or 1
        # A song-global threshold can miss quieter hits within the tail.
        # Re-screen the local window before treating it as an isolated decay.
        local_rises=[other['frame']/rate for other in inspect(original[at:at+rate],rate,segment) if other['frame']>rate*.035]
        local_gap=min(local_rises,default=1)
        effective_following=max(following,len(local_rises))
        effective_gap=min(gap,local_gap)
        score = event['bands'][2]*flatness*after100*min(effective_gap,1)/(1+effective_following)
        features=accent_features(segment,body[at:at+rate],rate)
        score *= (1-min(1,features['medianBodyPeriodicity']))**2
        score *= max(.01,1-features['peakMilliseconds']/1000)
        ranked.append(dict(source=str(source),seconds=at/rate,
            unfilteredBands=event['bands'],attackHighBandFlatness=flatness,
            highEnergyAfter100msFraction=after100,
            subsequentDetectedRisesWithinSecond=following,
            locallyDetectedTailRiseSeconds=local_rises,
            nextDetectedRiseSeconds=event['nextTransientSeconds'],rank=score,
            accentFeatures=features,
            tailMayContainOtherHits=True))
    if hashlib.sha256(source.read_bytes()).hexdigest() != before:
        raise ValueError('Source changed')
    hashes[str(source)] = before
print(json.dumps(dict(inputHashes=hashes,candidates=len(ranked),
    top=sorted(ranked,key=lambda event:event['rank'],reverse=True)[:10],
    scope='Heuristic high-band attack/decay ranking. Later hits may contribute tail energy; neither clean separation nor instrument identity is certified.',
    approvedForGame=False)))
