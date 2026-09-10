import {initializeRaceFields} from './initialize-race-fields.ts';
/** Original 0x91c8..0x9311; buffer starts at DS:8c06 and includes DS:8edf. */
export function initializeRaceShared(before:Uint8Array,column:number,row:number,angle:number,hill:0|1){
 const out=initializeRaceFields(before,column,row,angle,hill);
 const view=new DataView(out.buffer,out.byteOffset,out.byteLength);
 view.setUint16(0x18,0,true);view.setUint16(0x1a,1,true);
 out[0x8eaa-0x8c06]=1;
 out.fill(0,0x8eab-0x8c06,0x8eaf-0x8c06);
 out.fill(0,0x8eb0-0x8c06,0x8ee0-0x8c06);
 out.fill(0,0x8e44-0x8c06,0x8e74-0x8c06);
 return out;
}
