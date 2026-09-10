import {buildViewAudioSample,type AudioListenerView} from './view-audio-sample.ts';
import {buildCameraAudioSample,buildFollowingAudioSample,type AudioSampleCar} from './audio-sample-build.ts';
import {stepAudioSampleQueue,type AudioSampleQueueState} from './audio-sample-queue.ts';
import type {Vector} from '../physics/math.ts';
export interface DrivingAudioQueueSeed extends AudioSampleQueueState {records:number[][]}
/** Original forty-record producer/consumer. A full ring is not distinguished
 * from an empty ring by the original writer at 0xaa76; retain that behavior.
 * Sound-flag transitions surrounding the producer remain the caller's job.
 */
export function createDrivingAudioQueue(seed:DrivingAudioQueueSeed){
 if(seed.records.length!==40||seed.records.some(r=>r.length!==34))throw Error('Invalid original audio ring');
 const records=seed.records.map(r=>Uint8Array.from(r));
 let state:AudioSampleQueueState={counter:seed.counter,read:seed.read,write:seed.write,busy:seed.busy,stackMatches:seed.stackMatches};
 return {
  enqueue(player:AudioSampleCar,opponent:AudioSampleCar|null=null,focusOpponent=false,listener?:{previous:Vector;current:Vector}){
   if(state.write<0||state.write>=40)throw Error('Invalid original audio write index');
   records[state.write].set(listener?buildCameraAudioSample(records[state.write],player,opponent,listener):buildFollowingAudioSample(records[state.write],player,opponent,focusOpponent));
   state.write=(state.write+1)&65535;if(state.write===40)state.write=0;
  },
  enqueueView(player:AudioSampleCar,opponent:AudioSampleCar|null,view:AudioListenerView){
   if(state.write<0||state.write>=40)throw Error('Invalid original audio write index');
   records[state.write].set(buildViewAudioSample(records[state.write],player,opponent,view));
   state.write=(state.write+1)&65535;if(state.write===40)state.write=0;
  },
  discardPending(){state.read=state.write;},
  tick(){
   const next=stepAudioSampleQueue(state);state={...state,counter:next.counter,read:next.read};
   return next.events.map(event=>{
    const record=records[event.index],v=new DataView(record.buffer,record.byteOffset,record.byteLength);
    const vector=(offset:number):Vector=>[v.getInt16(offset,true),v.getInt16(offset+2,true),v.getInt16(offset+4,true)];
    return {interval:event.interval,player:{rpm:v.getUint16(30,true),previous:vector(6),current:vector(12)},opponent:{rpm:v.getUint16(32,true),previous:vector(18),current:vector(24)}};
   });
  },
  snapshot(){return {...state,records:records.map(r=>Array.from(r))};},
 };
}
