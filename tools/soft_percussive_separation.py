"""Shared-stereo median masks. Separated output is not source truth."""
import numpy as np

def split_percussive(pcm, window=2048, hop=256, kernel=17):
    if pcm.ndim != 2 or pcm.shape[1] != 2 or not np.all(np.isfinite(pcm)):
        raise ValueError('Require finite stereo PCM')
    if len(pcm)<window or len(pcm)>32000*10:
        raise ValueError('Require bounded separation window')
    padding=window//2
    padded=np.pad(pcm,((padding,padding+window),(0,0)))
    starts=np.arange(0,len(padded)-window+1,hop)
    taper=np.hanning(window)
    frames=np.array([padded[at:at+window]*taper[:,None] for at in starts])
    spectrum=np.fft.rfft(frames,axis=1)
    magnitude=np.mean(abs(spectrum),axis=2)
    def median_axis(values,axis):
        pads=[(0,0)]*values.ndim;pads[axis]=(kernel//2,kernel//2)
        return np.median(np.lib.stride_tricks.sliding_window_view(
            np.pad(values,pads,mode='edge'),kernel,axis=axis),axis=-1)
    harmonic=median_axis(magnitude,0)
    percussive=median_axis(magnitude,1)
    mask=percussive**2/(harmonic**2+percussive**2+1e-20)
    def restore(weight):
        inverse=np.fft.irfft(spectrum*weight[:,:,None],n=window,axis=1)
        output=np.zeros_like(padded);normal=np.zeros(len(padded))
        for at,frame in zip(starts,inverse):
            output[at:at+window]+=frame*taper[:,None]
            normal[at:at+window]+=taper*taper
        output/=np.maximum(normal[:,None],1e-20)
        return output[padding:padding+len(pcm)]
    return restore(mask),restore(1-mask)
