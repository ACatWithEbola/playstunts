import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {originalBoundaryModelSubmissions} from './boundary-model-submissions.ts';
import {originalTerrainModelSubmissions} from './terrain-model-submissions.ts';
import {prepareOriginalRoadTileGeometry} from './prepare-road-tile.ts';
import {originalRoadSubmissionState,type RoadSubmissionState} from './road-submission-state.ts';
import type {RoadModelSubmission} from './road-model-submissions.ts';
/** Stateful original boundary/terrain/road pass with direct-draw early exits. */
export function submitOriginalStaticTile(memory:Uint8Array,d:number,tile:number,terrain:number,column:number,row:number,detail:number,paint:number,camera:readonly number[],referenceTile:readonly number[],before:RoadSubmissionState,drawDirect:(record:number[])=>number,resetQueue:()=>void=()=>{},layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const state={...before,tileMask:0,deferredRecord:[...before.deferredRecord]},submissions:RoadModelSubmission[]=[];
 const direct=(record:number[])=>{submissions.push({mode:'direct',record,depthBias:0});return (drawDirect([...record])<<24>>24)>0;};
 for(const record of originalBoundaryModelSubmissions(memory,d,tile,column,row,detail,camera,layout))if(direct(record))return {state,submissions,stopped:true};
 const ground=originalTerrainModelSubmissions(memory,d,terrain,tile,column,row,camera,layout);
 for(const record of ground.records)if(direct(record))return {state,submissions,stopped:true};
 // CE74..CE7E resets the queue after terrain, before elevated road underlays.
 resetQueue();
 if(!tile)return {state,submissions,stopped:false};
 const road=prepareOriginalRoadTileGeometry(memory,d,tile,column,row,ground.height,camera,layout);
 for(const s of road.underlays)if(direct(s.record))return {state,submissions,stopped:true};
 const result=originalRoadSubmissionState(memory,d,tile,detail,paint,road.position,[column,row],referenceTile,state,drawDirect,layout);
 return {...result,submissions:submissions.concat(result.submissions)};
}
