import {TRACK_DISPLAY_LAYOUTS,type OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {i16} from '../physics/math.ts';
import {slopeRoadMap} from '../physics/slope-road-map.ts';
/** SuppliedE91D..ED51. The overview halves coordinates and drains after each
 * tile. Its region pointer changes permanently after a four-tile terrain pass. */
export function originalTrackOverviewSubmissions(memory:Uint8Array,d:number,emit:(record:number[]|null)=>void,layout:OriginalTrackDisplayLayout=TRACK_DISPLAY_LAYOUTS.mcga,regionPointer=0xb100){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(o:number)=>view.getUint16(d+(o&65535),true),signed=(o:number)=>view.getInt16(d+(o&65535),true),byte=(o:number)=>memory[d+(o&65535)];
 const terrain=(x:number,y:number)=>memory[word(layout.address(0x9ad2))*16+((word(layout.address(0x9ad0))+word(layout.address(0x89d4)+y*2)+x)&65535)],tile=(x:number,y:number)=>memory[word(layout.address(0x9358))*16+((word(layout.address(0x9356))+word(layout.address(0xa350)+y*2)+x)&65535)];
 const half=(value:number,camera:number)=>Math.trunc(i16(value-camera)/2),camera=[signed(0x8f6),signed(0x8f8),signed(0x8fa)],record=new Uint8Array(20),v=new DataView(record.buffer);
 const set=(o:number,value:number)=>v.setUint16(o,value,true);set(8,regionPointer);set(16,1024);
 const position=(x:number,y:number,height:number)=>[half(signed(layout.address(0xa3e2)+x*2),camera[0]),half(height,camera[1]),half(signed(layout.address(0xa796)+y*2),camera[2])];
 const draw=(position:readonly number[],descriptor:number,angle:number,flags:number,paint:number)=>{position.forEach((n,i)=>set(i*2,n));set(6,descriptor);set(14,angle);record[18]=flags;record[19]=paint;emit(Array.from(record));};
 for(let y=0;y<30;y++)for(let x=0;x<30;x++){
  let road=tile(x,y),ground=terrain(x,y),height=0;
  if(road&&ground>=7&&ground<11){road=slopeRoadMap(ground,road);ground=0;}
  if(road>=253&&road<=255){road=0;ground=0;}
  if(ground===6){height=signed(0x124);if(road)ground=0;}
  else if(road>=105&&road<=108){
   for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]]){const g=terrain(x+dx,y+dy);if(g){const p=0x2bda+g*14;set(8,layout.address(0x9022));draw(position(x+dx,y+dy,0),word(p+4),word(p+2),5,0);}}
   ground=0;
  }
  if(ground){const p=0x2bda+ground*14;draw(position(x,y,height),word(p+6),word(p+2),5,0);}
  if(road){
   const p=0x2018+road*14,flags=byte(p+11),px=signed((flags&2?layout.address(0x7378):layout.address(0xa3e2))+x*2),pz=signed((flags&1?layout.address(0x7f9e):layout.address(0xa796))+y*2),pos=[half(px,camera[0]),half(height,camera[1]),half(pz,camera[2])];
   if(height){const descriptor=[layout.address(0x7820),layout.address(0x7c40),layout.address(0x7c56),layout.address(0x7c6c)][flags]??v.getUint16(6,true);draw(pos,descriptor,0,5,0);}
   const overlay=byte(p+8),extra=0x2018+overlay*14;
   if(overlay&&word(extra+6))draw(pos,word(extra+6),word(p+2),5,byte(extra+9)&128?0:byte(extra+9));
   draw(pos,word(p+6),word(p+2),byte(p+10)|4,byte(p+9)&128?0:byte(p+9));
  }
  emit(null);
 }
}
