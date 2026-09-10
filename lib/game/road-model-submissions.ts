import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
/** Supplied D002..D1B1. Prepare road/overlay submissions without changing their
 * original positions. Queued overlays follow their base with depth bias -2048.
 * This covers submission preparation, not projection or queue sorting.
 */
export interface RoadModelSubmission {mode:'direct'|'queued';record:number[];depthBias:number}
export function originalRoadModelSubmissions(memory:Uint8Array,d:number,tile:number,detail:number,paintFrame:number,position:readonly number[],layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga):RoadModelSubmission[]{
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const byte=(p:number)=>memory[d+(p&65535)],word=(p:number)=>view.getUint16(d+(p&65535),true);
 const descriptor=0x2018+(tile&255)*14,overlay=byte(descriptor+8),out:RoadModelSubmission[]=[];
 const prepare=(p:number,direct:boolean)=>{
  const result=new Uint8Array(20),v=new DataView(result.buffer);
  [position[0],position[1],position[2],word(p+((detail&255)?6:4)),layout.address(direct?0x9022:0x902a),0,0,word(p+2),byte(p+11)?0x400:0x800].forEach((n,i)=>v.setUint16(i*2,n,true));
  result[18]=byte(p+10)|4;result[19]=(byte(p+9)&128)?paintFrame:byte(p+9);
  return Array.from(result);
 };
 let deferred:number[]|undefined;
 if(overlay){
  const p=0x2018+overlay*14;
  if(word(p+((detail&255)?6:4))){
   const direct=!!(byte(p+10)&1),record=prepare(p,direct);
   if(direct)out.push({mode:'direct',record,depthBias:0});else deferred=record;
  }
 }
 const direct=!!(byte(descriptor+10)&1);
 out.push({mode:direct?'direct':'queued',record:prepare(descriptor,direct),depthBias:0});
 if(!direct&&deferred)out.push({mode:'queued',record:deferred,depthBias:-2048});
 return out;
}
