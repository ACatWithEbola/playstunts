"""Descriptive one-second accent features, not an instrument classifier."""
import numpy as np

def accent_features(high, body, rate):
    if high.shape != body.shape or high.ndim != 2 or high.shape[1] != 2 or len(high) != rate:
        raise ValueError('Require matching one-second stereo windows')
    if not np.all(np.isfinite(high)) or not np.all(np.isfinite(body)):
        raise ValueError('Nonfinite accent evidence')
    bins=np.array([np.mean(part*part) for part in np.array_split(high,100)])
    if np.sum(bins)<=1e-12:
        raise ValueError('Silent high-band accent')
    correlations=[]
    for offset in [0,.1,.3,.6]:
        y=body[round(offset*rate):round((offset+.08)*rate)]
        values=[]
        for lag in range(max(1,round(rate/1230)),round(rate/80)+1):
            u,v=y[:-lag],y[lag:]
            denominator=np.sqrt(np.sum(u*u)*np.sum(v*v))
            if denominator>1e-20:
                values.append(float(np.sum(u*v)/denominator))
        correlations.append(max(values,default=0))
    return dict(peakMilliseconds=int(np.argmax(bins))*10,
        lastFirst100msEnergyRatio=float(np.sum(bins[-10:])/max(np.sum(bins[:10]),1e-20)),
        energy50Milliseconds=int(np.searchsorted(np.cumsum(bins),np.sum(bins)*.5))*10,
        energy90Milliseconds=int(np.searchsorted(np.cumsum(bins),np.sum(bins)*.9))*10,
        medianBodyPeriodicity=float(np.median(correlations)))
