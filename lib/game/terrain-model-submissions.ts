import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
/** Supplied CC2C..CE73: terrain before road submission. Four-tile roads
 * 105..108 read each underlying terrain tile in original column/row order.
 */
export function originalTerrainModelSubmissions(memory:Uint8Array,d:number,terrain:number,tile:number,column:number,row:number,camera:readonly number[],layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(p:number)=>view.getUint16(d+(p&65535),true),signed=(n:number)=>n<<24>>24;
 const records:number[][]=[];let height=0,current=terrain&255;
 const submit=(x:number,y:number,id:number,elevation:number)=>{
  const record=new Uint8Array(20),v=new DataView(record.buffer),descriptor=0x2bda+id*14;
  [word(layout.address(0xa3e2)+signed(x)*2)-camera[0],elevation-camera[1],word(layout.address(0xa796)+signed(y)*2)-camera[2],word(descriptor+4),layout.address(elevation?0x902a:0x9022),0,0,word(descriptor+2),0x400].forEach((n,i)=>v.setUint16(i*2,n,true));
  record[18]=5;records.push(Array.from(record));
 };
 if(current===6){height=word(0x124);if(tile)current=0;}
 else if(tile>=105&&tile<=108){
  for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]){
   const x=signed(column+dx),y=signed(row+dy),offset=(word(layout.address(0x9ad0))+word(layout.address(0x89d4)+y*2)+x)&65535;
   current=memory[word(layout.address(0x9ad2))*16+offset];
   if(current)submit(x,y,current,0);
  }
  current=0;
 }
 if(current)submit(column,row,current,height);
 return {records,height,terrain:current};
}
