import {allocateOriginalReplayCheckpoints} from './allocate-replay-checkpoints.ts';
import {freeResource} from './free-resource.ts';
import {hasReplayCheckpointCapacity} from './replay-checkpoint-capacity.ts';
import type {ReplayCadence} from './replay-cadence.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Transactional checkpoint replacement. The caller must initialize the new
 * replay before use; prior checkpoints are deliberately not copied across rates.
 * This never edits the input memory, including allocator failure paths. */
export function growReplayCheckpoints(before:Uint8Array,d:number,rate:ReplayCadence,engine?:PhysicsEngineVersion){
 if(hasReplayCheckpointCapacity(before,d,rate,'mcga',engine))return before.slice();
 const v=new DataView(before.buffer,before.byteOffset,before.byteLength),word=(at:number)=>v.getUint16(d+at,true);
 const offset=word(0xa030),segment=word(0xa032),first=word(0x4b12),last=word(0x4b14);
 if(offset!==0||last<first||last+18>65536||(last-first)%18!==0)throw Error('Invalid checkpoint allocation');
 let found=false;
 for(let at=first;at<=last;at+=18)if(word(at+16)===2&&word(at+14)===segment){found=true;break;}
 if(!found)throw Error('Checkpoint allocation is not resident');
 const allocated=allocateOriginalReplayCheckpoints(before,d,'mcga',rate,engine);
 if(allocated.error)throw Error('Checkpoint growth failed: '+allocated.error);
 const released=freeResource(allocated.memory,d,offset,segment);
 if(released.error)throw Error('Old checkpoint release failed: '+released.error);
 if(!hasReplayCheckpointCapacity(released.memory,d,rate,'mcga',engine))throw Error('Replacement checkpoint bank lacks capacity');
 return released.memory;
}
