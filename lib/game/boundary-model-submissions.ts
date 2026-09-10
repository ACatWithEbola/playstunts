import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
/** Supplied DC68..DCB6 and CA94..CC2B: map-edge models for a selected tile.
 * Footprint 2 deliberately visits three offsets, including the repeated anchor.
 */
export function originalBoundaryModelSubmissions(memory:Uint8Array,d:number,tile:number,column:number,row:number,detail:number,camera:readonly number[],layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(p:number)=>view.getUint16(d+(p&65535),true),byte=(p:number)=>memory[d+(p&65535)],signed=(n:number)=>n<<24>>24;
 const footprint=tile?byte(0x2018+tile*14+11):0,count=[1,2,3,4][footprint],table=tile?[0x8dc,0x8de,0x8e2,0x8e6][footprint]:0x8e2;
 if(table===undefined)throw Error('Original edge footprint requires retained caller state');
 const records:number[][]=[];
 for(let i=0;i<count;i++){
  const x=signed(column+byte(table+i*2)),y=signed(row+byte(table+i*2+1));
  const edge=x===0?(y===0?7:y===29?5:6):x===29?(y===0?1:y===29?3:2):y===0?0:y===29?4:-1;
  if(edge<0)continue;
  const descriptor=0x2018+byte(0x8d4+edge)*14,record=new Uint8Array(20),v=new DataView(record.buffer);
  [word(layout.address(0xa3e2)+x*2)-camera[0],-camera[1],word(layout.address(0xa796)+y*2)-camera[2],word(descriptor+((detail&255)?6:4)),layout.address(0x9022),0,0,word(0x8c4+edge*2),0x400].forEach((n,j)=>v.setUint16(j*2,n,true));
  record[18]=5;records.push(Array.from(record));
 }
 return records;
}
