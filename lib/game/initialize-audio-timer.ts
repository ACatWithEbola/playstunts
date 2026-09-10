import {addOriginalTimerCallback} from './add-timer-callback.ts';
/** Original18FD8: reset record status bytes, retain other audio state, and
 * register the shared callback after setting the original counter to22. */
export function initializeOriginalAudioTimer(memory:Uint8Array,d:number,mode:'mcga'|'cga'|'tandy'|'ega'='mcga'){
 const low={mcga:0,cga:0x5da,tandy:0x616,ega:0x462}[mode];
 for(let at=0x618e;at<0x68fa;at+=76)memory[d+at+low]=0;
 new DataView(memory.buffer,memory.byteOffset,memory.byteLength).setUint16(d+0x68fa+low,22,true);
 addOriginalTimerCallback(memory,d,0x3fd,0x18fd);
}
