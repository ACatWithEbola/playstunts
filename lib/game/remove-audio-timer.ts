import {removeOriginalTimerCallback} from './remove-timer-callback.ts';
/** Original18fff..1902f. Only status1 stops its driver voice, but every
 * control record is cleared before removing the shared audio callback. */
export function removeOriginalAudioTimer(host:{memory():Uint8Array;stopEffect(handle:number):void},d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const low={mcga:0,cga:0x5da,tandy:0x616,ega:0x462}[mode];
 for(let at=0x618e;at<0x68fa;at+=76){
  const memory=host.memory();
  if(memory[d+at+low]===1)host.stopEffect(new DataView(memory.buffer,memory.byteOffset,memory.byteLength).getUint16(d+at+low+2,true));
  host.memory()[d+at+low]=0;
 }
 removeOriginalTimerCallback(host.memory(),d,0x3fd,0x18fd);
}
