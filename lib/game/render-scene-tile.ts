import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalModelDisplayLayout} from './model-display-layout.ts';
import type {Vector} from '../physics/math.ts';
import type {Particle} from './particles.ts';
import type {RoadSubmissionState} from './road-submission-state.ts';
import {submitOriginalSceneTile} from './submit-scene-tile.ts';
import {drainOriginalModelQueueMemory} from './drain-model-queue-memory.ts';
/** Complete original tile submission and queue drain before advancing SI. */
export function renderOriginalSceneTile(memory:Uint8Array,d:number,tile:number,terrain:number,column:number,row:number,detail:number,paint:number,camera:Vector,before:RoadSubmissionState,player:readonly number[],opponent:readonly number[],particles:readonly Particle[],visibility:{player:number;opponent:number},draw:(record:number[],index:number|null,palette:number)=>number,updateWheels:(args:number[])=>void,layout:OriginalModelDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const a=layout.address;
 const prepared=submitOriginalSceneTile(memory,d,tile,terrain,column,row,detail,paint,camera,before,player,opponent,particles,record=>draw(record,null,memory[d+a(0x9b28)]),updateWheels,layout);
 if(prepared.stopped)return {...prepared,visibility:{...visibility},palette:memory[d+a(0x9b28)]};
 const drained=drainOriginalModelQueueMemory(memory,d,visibility,draw,layout);
 return {...prepared,stopped:drained.stopped,visibility:{player:drained.player,opponent:drained.opponent},palette:drained.palette};
}
