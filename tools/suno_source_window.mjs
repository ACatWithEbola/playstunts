/** Select in source time when a later filter changes playback rate. */
import {isAbsolute} from 'node:path';
export function sunoSourceWindow(source,start,seconds,rateChanging=false){
 if(!isAbsolute(source)||!Number.isFinite(start)||start<0||!Number.isFinite(seconds)||seconds<=0||seconds>2||typeof rateChanging!=='boolean')throw Error('Invalid bounded source window');
 const span=['-ss',String(start),'-t',String(seconds)];
 return rateChanging?[...span,'-i',source]:['-i',source,...span];
}
