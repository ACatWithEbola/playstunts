import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalModelDisplayLayout} from './model-display-layout.ts';
import type {Vector} from '../physics/math.ts';
import type {Particle} from './particles.ts';
import type {RoadSubmissionState} from './road-submission-state.ts';
import {submitOriginalStaticTile} from './submit-static-tile.ts';
import {prepareOriginalTrackSign} from './prepare-track-sign.ts';
import {prepareOriginalDynamicTile} from './prepare-dynamic-tile.ts';
import {enqueueOriginalModelRecord} from './enqueue-model-record.ts';
/** Original DC68..DB71 tile preparation; caller drains its queue next.
 * Queue writes can overwrite the retained overlay record at DS70FE.
 */
export function submitOriginalSceneTile(memory:Uint8Array,d:number,tile:number,terrain:number,column:number,row:number,detail:number,paint:number,camera:Vector,before:RoadSubmissionState,player:readonly number[],opponent:readonly number[],particles:readonly Particle[],drawDirect:(record:number[])=>number,updateWheels:(args:number[])=>void,layout:OriginalModelDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const a=layout.address;
 const coordinates=[column,row],reference=[memory[d+a(0x8fba)],memory[d+a(0x8fbc)]];
 const result=submitOriginalStaticTile(memory,d,tile,terrain,column,row,detail,paint,camera,reference,before,drawDirect,()=>{memory[d+a(0xa38e)]=0;new DataView(memory.buffer,memory.byteOffset,memory.byteLength).setUint16(d+a(0xaa44),a(0x70ea),true);},layout);
 memory.set(result.state.deferredRecord,d+a(0x70fe));
 const submissions=result.submissions.map(s=>({...s,tag:0}));
 if(result.stopped)return {...result,submissions};
 for(const s of submissions)if(s.mode==='queued')enqueueOriginalModelRecord(memory,d,s.record,s.depthBias,s.tag,layout);
 if(tile)for(const s of prepareOriginalTrackSign(memory,d,column,row,particles,camera,layout)){
  const record={...s,tag:0};submissions.push(record);enqueueOriginalModelRecord(memory,d,s.record,s.depthBias,0,layout);
 }
 const footprint=tile?memory[d+0x2018+(tile&255)*14+11]:0;
 const farCorner=[(column+((footprint&2)?1:0))&255,(row+((footprint&1)?1:0))&255];
 const dynamic=prepareOriginalDynamicTile(memory,d,camera,detail,coordinates,farCorner,{column:player[0],row:player[1],depthBias:result.state.playerBias},{column:opponent[0],row:opponent[1],depthBias:result.state.opponentBias},particles,result.state.tileMask,updateWheels,layout);
 for(const s of dynamic){submissions.push(s);enqueueOriginalModelRecord(memory,d,s.record,s.depthBias,s.tag,layout);}
 return {state:{...result.state,deferredRecord:Array.from(memory.subarray(d+a(0x70fe),d+a(0x70fe)+20))},submissions,stopped:false};
}
