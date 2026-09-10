import {drawOriginalDialogDisplay,type OriginalDialogDisplayHost} from './dialog-display.ts';
/** Original 1B9E4 uses its retained driver-specific vertical position. */
export function drawOriginalRaceWaitingDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalDialogDisplayHost,text:ReadonlyArray<number>,scratch:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(d+at,true),y={cga:0x8ff0,tandy:0x9030,ega:0x8e6c}[mode];
 const content=drawOriginalDialogDisplay(memory,d,mode,host,text,0,{text:word(0x4e8a),border:word(0x4ec2),disabled:word(0x4ec0)},scratch,undefined,0,{x:-1,y:v.getInt16(d+y,true)});
 memory[d+0x131]=0;return content;
}
