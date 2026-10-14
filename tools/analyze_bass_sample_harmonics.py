"""Read-only candidate harmonic model; not audible sample acceptance."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
import numpy as np


def fit(samples, rate, low, high, step=.025, harmonics=8):
    if len(samples) < 100 or samples.ndim != 2 or samples.shape[1] != 2:
        raise ValueError('Require sufficiently long stereo samples')
    if not np.all(np.isfinite(samples)) or np.sum(samples ** 2) <= 1e-12:
        raise ValueError('No finite voiced evidence')
    voiced_energy=float(np.sum((samples-np.mean(samples,axis=0))**2))
    if voiced_energy<=1e-12:
        raise ValueError('DC offset is not voiced evidence')
    if not isinstance(harmonics, int) or not 1 <= harmonics <= 32 or not 0 < low < high < rate / (2*harmonics) or step <= 0:
        raise ValueError('Invalid bounded harmonic search')
    time = np.arange(len(samples)) / rate
    best = None
    for hz in np.arange(low, high, step):
        basis = np.column_stack([np.ones(len(time))] + [
            fn(2 * np.pi * hz * harmonic * time)
            for harmonic in range(1, harmonics+1) for fn in [np.sin, np.cos]])
        coefficients = np.linalg.lstsq(basis, samples, rcond=None)[0]
        residual = samples - basis @ coefficients
        fraction = float(np.sum(residual ** 2) / voiced_energy)
        if best is None or fraction < best['residualEnergyFraction']:
            best = dict(fundamentalHz=float(hz), residualEnergyFraction=fraction,
                        stereoCoefficients=coefficients.tolist())
    return best


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('source', type=Path)
    parser.add_argument('--start', type=float, required=True)
    parser.add_argument('--seconds', type=float, required=True)
    parser.add_argument('--low', type=float, required=True)
    parser.add_argument('--high', type=float, required=True)
    parser.add_argument('--analysis-rate', type=int, choices=[8000, 16000, 32000], default=8000)
    parser.add_argument('--step', type=float, default=.025)
    parser.add_argument('--harmonics', type=int, default=8)
    args = parser.parse_args()
    if not np.isfinite(args.start) or args.start < 0 or not .05 <= args.seconds <= .5:
        raise ValueError('Require bounded sample region')
    source = args.source.resolve(strict=True)
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    rate = args.analysis_rate
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(source),
        '-ss', str(args.start), '-t', str(args.seconds), '-ac', '2', '-ar', str(rate),
        '-f', 'f32le', 'pipe:1'])
    samples = np.frombuffer(raw, dtype='<f4').reshape(-1, 2).astype(float)
    if len(samples) != round(rate * args.seconds):
        raise ValueError('Source region incomplete')
    result = fit(samples, rate, args.low, args.high, args.step, args.harmonics)
    halves = [fit(part, rate, args.low, args.high, args.step, args.harmonics) for part in np.array_split(samples, 2)]
    if hashlib.sha256(source.read_bytes()).hexdigest() != digest:
        raise ValueError('Source changed')
    print(json.dumps(dict(source=str(source), sourceSha256=digest, start=args.start,
        seconds=args.seconds, analysisRate=rate, harmonics=args.harmonics, model=result,
        halfWindows=[dict(fundamentalHz=x['fundamentalHz'],
            residualEnergyFraction=x['residualEnergyFraction']) for x in halves],
        acceptedForReconstruction=False,
        scope='Bounded harmonic stereo model; residual can include envelopes, noise or other voices. Not proof of clean separation, intended pitch or retained Suno sound.')))


if __name__ == '__main__':
    main()
