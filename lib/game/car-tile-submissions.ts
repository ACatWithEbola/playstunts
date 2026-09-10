import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import type {Particle} from './particles.ts';
import type {Vector} from '../physics/math.ts';
import {originalCarMatchesSubmissionTile} from './car-tile-submission-gate.ts';
import {originalCarParticleSubmission} from './car-particle-submission.ts';
import {originalPlayerCarSubmission,originalOpponentCarSubmission} from './player-car-submission.ts';
type Placement={column:number;row:number;depthBias:number};
/** Supplied D468..D94B: selected player fragments and car, then opponent.
 * The caller's current and retained tile coordinates are already prepared.
 */
export function originalCarTileSubmissions(memory:Uint8Array,d:number,camera:Vector,detail:number,tile:readonly number[],retainedTile:readonly number[],player:Placement,opponent:Placement,particles:readonly Particle[],tileMask:number,updateWheels:(args:number[])=>void,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 if(particles.length!==24)throw Error('Original particle pool has 24 slots');
 const data=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),submissions=[];
 for(const owner of [0,1]){
  const placement=owner===0?player:opponent;
  if(!originalCarMatchesSubmissionTile([placement.column,placement.row],tile,retainedTile))continue;
  if(memory[d+layout.address(0x8ee0)]!==0){
   const car=[0,1,2].map(axis=>data.getInt32(d+layout.address(owner===0?0x8c38:0x8cf0)+axis*4,true)) as Vector;
   for(const p of particles)if((p.speed&65535)!==0&&(p.owner&255)===owner)submissions.push(originalCarParticleSubmission(memory,d,p,car,camera,placement.depthBias,tileMask,layout));
  }
  submissions.push((owner===0?originalPlayerCarSubmission:originalOpponentCarSubmission)(memory,d,camera,detail,placement.depthBias,tileMask,updateWheels,layout));
 }
 return submissions;
}
