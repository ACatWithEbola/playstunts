import {raceStartVector} from './race-start-vector.ts';
import {resetRaceFields} from './race-reset.ts';
/** Original 0x9208..0x9311; supplied buffer begins at DS:8c06. */
export function initializeRaceFields(before:Uint8Array,column:number,row:number,angle:number,hill:0|1){
 const out=before.slice(),view=new DataView(out.buffer,out.byteOffset,out.byteLength);
 raceStartVector(column,row,angle,hill).forEach((value,axis)=>view.setInt16(axis*2,value,true));
 return resetRaceFields(out);
}
