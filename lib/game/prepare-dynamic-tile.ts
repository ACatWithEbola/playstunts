import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {originalCarTileSubmissions} from './car-tile-submissions.ts';
import {originalStartTruckSubmission} from './start-truck-submission.ts';
import type {Vector} from '../physics/math.ts';
import type {Particle} from './particles.ts';
/** Original D468..DB71 dynamic queue order, after road and sign records. */
export function prepareOriginalDynamicTile(memory:Uint8Array,d:number,camera:Vector,detail:number,tile:readonly number[],retainedTile:readonly number[],player:{column:number;row:number;depthBias:number},opponent:{column:number;row:number;depthBias:number},particles:readonly Particle[],tileMask:number,updateWheels:(args:number[])=>void,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const records=originalCarTileSubmissions(memory,d,camera,detail,tile,retainedTile,player,opponent,particles,tileMask,updateWheels,layout);
 const truck=originalStartTruckSubmission(memory,d,tile,retainedTile,camera,tileMask,layout);
 if(truck)records.push(truck);
 return records;
}
