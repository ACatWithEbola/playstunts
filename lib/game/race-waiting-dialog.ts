import {drawOriginalDialog} from './dialog-raster.ts';
/** Original1B9E4: immediate MAIN waiting dialog, centered horizontally at the
 * caller's retained Y coordinate, then hide the cursor. It does not poll input. */
export function drawOriginalRaceWaiting(pixels:Uint8Array,font:Uint8Array,text:ReadonlyArray<number>,memory:Uint8Array,d:number){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const result=drawOriginalDialog(pixels,font,text,0,{text:v.getUint16(d+0x4e8a,true),border:v.getUint16(d+0x4ec2,true),disabled:1},undefined,0,{x:-1,y:v.getInt16(d+0x8a10,true)});
 memory[d+0x131]=0;return result;
}
