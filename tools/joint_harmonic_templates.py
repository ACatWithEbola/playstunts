"""Bounded joint tone fit. A decomposition is not clean-source certification."""
import numpy as np

def joint_templates(samples, rate, frequencies, harmonics=8):
    if samples.ndim != 2 or samples.shape[1] != 2 or len(samples) < 100:
        raise ValueError('Require bounded stereo evidence')
    if not np.all(np.isfinite(samples)) or np.sum(samples*samples) <= 1e-12:
        raise ValueError('Require finite voiced evidence')
    if not 1 <= len(frequencies) <= 4 or not isinstance(harmonics, int) or not 1 <= harmonics <= 32:
        raise ValueError('Invalid bounded template count')
    if any(not np.isfinite(hz) or hz <= 0 or hz*harmonics >= rate/2 for hz in frequencies):
        raise ValueError('Invalid template frequency')
    time = np.arange(len(samples))/rate
    matrix = np.column_stack([np.ones(len(time))] + [
        fn(2*np.pi*hz*h*time) for hz in frequencies
        for h in range(1, harmonics+1) for fn in [np.sin, np.cos]])
    condition = float(np.linalg.cond(matrix))
    if not np.isfinite(condition) or condition > 100:
        raise ValueError('Ambiguous or unstable joint templates')
    coefficients = np.linalg.lstsq(matrix, samples, rcond=None)[0]
    residual = samples-matrix@coefficients
    models = []
    for index, hz in enumerate(frequencies):
        begin = 1+index*harmonics*2
        models.append(dict(fundamentalHz=hz, stereoCoefficients=
            np.vstack([np.zeros((1, 2)), coefficients[begin:begin+harmonics*2]]).tolist()))
    return dict(models=models, unassignedDC=coefficients[0].tolist(),
                condition=condition,
                residualEnergyFraction=float(np.sum(residual**2)/np.sum(samples**2)),
                cleanSeparationVerified=False, sunoCharacterApproved=False)
