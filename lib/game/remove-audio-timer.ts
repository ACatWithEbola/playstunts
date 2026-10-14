import {removeOriginalTimerCallback} from './remove-timer-callback.ts';
/** Original18fff..1902f. Only status1 stops its driver voice, but every
 * control record is cleared before removing the shared audio callback. */
function* audioTimerRemoval(memory:()=>Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'){
 const low={mcga:0,cga:0x5da,tandy:0x616,ega:0x462}[mode];
 for(let at=0x618e;at<0x68fa;at+=76){
  const current=memory();
  if(current[d+at+low]===1)yield new DataView(current.buffer,current.byteOffset,current.byteLength).getUint16(d+at+low+2,true);
  memory()[d+at+low]=0;
 }
 removeOriginalTimerCallback(memory(),d,0x3fd,0x18fd);
}
export function removeOriginalAudioTimer(host:{memory():Uint8Array;stopEffect(handle:number):void},d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 for(const handle of audioTimerRemoval(()=>host.memory(),d,mode))host.stopEffect(handle);
}
/** Same source ordering, with explicit delivery barrier before clearing each
 * active record. Failed delivery retains its record/timer for caller recovery. */
export async function removeOriginalAudioTimerAsync(host:{memory():Uint8Array;stopEffect(handle:number):void|Promise<void>},d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 for(const handle of audioTimerRemoval(()=>host.memory(),d,mode))await host.stopEffect(handle);
}
