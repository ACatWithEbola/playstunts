import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {originalRoadCarDepthState} from './road-car-depth-state.ts';
import type {RoadModelSubmission} from './road-model-submissions.ts';
export interface RoadSubmissionState {deferredFlag:number;deferredRecord:number[];playerBias:number;opponentBias:number;tileMask:number}
/** Stateful supplied D002..D1B1 path. Direct base models retain the pending
 * overlay flag and the previous tile mask; queued bases consume the flag.
 */
export function originalRoadSubmissionState(memory:Uint8Array,d:number,tile:number,detail:number,paintFrame:number,position:readonly number[],coordinates:readonly number[],referenceTile:readonly number[],before:RoadSubmissionState,drawDirect:(record:number[])=>number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),byte=(p:number)=>memory[d+(p&65535)],word=(p:number)=>view.getUint16(d+(p&65535),true);
 const state={...before,deferredRecord:[...before.deferredRecord]},submissions:RoadModelSubmission[]=[];
 if(state.deferredRecord.length!==20)throw Error('Original deferred model record has 20 bytes');
 const descriptor=0x2018+(tile&255)*14;
 const prepare=(p:number)=>{
  const result=new Uint8Array(20),v=new DataView(result.buffer),direct=!!(byte(p+10)&1);
  [...position,word(p+((detail&255)?6:4)),layout.address(direct?0x9022:0x902a),0,0,word(p+2),byte(p+11)?0x400:0x800].forEach((n,i)=>v.setUint16(i*2,n,true));
  result[18]=byte(p+10)|4;result[19]=(byte(p+9)&128)?paintFrame:byte(p+9);return Array.from(result);
 };
 const direct=(record:number[])=>{submissions.push({mode:'direct',record:[...record],depthBias:0});return (drawDirect([...record])<<24>>24)>0;};
 const overlay=byte(descriptor+8);
 if(overlay){
  const p=0x2018+overlay*14,pointer=word(p+((detail&255)?6:4));
  state.deferredRecord[6]=pointer&255;state.deferredRecord[7]=pointer>>>8;
  if(pointer){state.deferredRecord=prepare(p);if(byte(p+10)&1){if(direct(state.deferredRecord))return {state,submissions,stopped:true};}else state.deferredFlag=1;}
 }
 const base=prepare(descriptor);
 if(byte(descriptor+10)&1){const stopped=direct(base);return {state,submissions,stopped};}
 submissions.push({mode:'queued',record:base,depthBias:0});
 const deferred=state.deferredFlag!==0;
 if(deferred){state.deferredFlag=0;submissions.push({mode:'queued',record:[...state.deferredRecord],depthBias:-2048});}
 Object.assign(state,originalRoadCarDepthState(deferred,state.playerBias,state.opponentBias,coordinates,referenceTile));
 return {state,submissions,stopped:false};
}
