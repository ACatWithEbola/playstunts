import {createRaceAudio} from './race-audio.ts';
import {readOriginalRaceAudioState,writeOriginalRaceAudioState} from './race-audio-memory.ts';
import {readOriginalCarSoundResources} from './read-car-sound-resources.ts';
import {stepEffectRuntime} from './effect-runtime.ts';
import {stepCarAudioRecords} from './engine-interrupt.ts';
import {produceRaceAudioInPlace,type RaceAudioRequest} from './produce-race-audio.ts';
import {stopEffect} from './effect-stop.ts';
import type {Vector} from '../physics/math.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {versionedAdlibRegisterWrites} from './versioned-adlib-register-writes.ts';
/** One allocated race's regular AdLib resources and live memory state.
 * Construct after allocation and music shutdown; discard before freeing banks. */
export function createAllocatedRaceAudio(memory:()=>Uint8Array,d:number,driverSegment:number,driverGeneration?:PhysicsEngineVersion,effectEngine?:import('../physics/engine-version.ts').PhysicsEngineVersion){
 const view=()=>{const m=memory();return new DataView(m.buffer,m.byteOffset,m.byteLength);};
 const word=(at:number)=>view().getUint16(d+at,true),byte=(at:number)=>memory()[d+at];
 if(byte(0x4e06))throw Error('Allocated race audio requires the regular AdLib driver');
 const handles=[word(0x8016)];if(byte(0x8fc8))handles.push(word(0x86de));
 const resources=readOriginalCarSoundResources(memory(),d,handles);
 const timerBridge=createEffectTimerBridge(effectEngine);
 const commit=(state:Parameters<typeof writeOriginalRaceAudioState>[2])=>timerBridge.write(state,value=>writeOriginalRaceAudioState(memory(),d,value));
 const state=()=>timerBridge.read({...readOriginalRaceAudioState(memory(),d,driverSegment,driverGeneration),effectEngine});
 const filter=(writes:number[][])=>versionedAdlibRegisterWrites(memory().subarray(driverSegment*16,driverSegment*16+0xa7d),writes,driverGeneration);
 const operate=<T>(operation:(race:ReturnType<typeof createRaceAudio>)=>T)=>{
  const race=createRaceAudio(state(),resources,byte(0x4e05)!==0,byte(0x9f5a));
  const result=operation(race);commit({...race.snapshot(),driverGeneration});return result;
 };
 const dispatch=(requests:readonly RaceAudioRequest[])=>{
  const writes=operate(race=>race.dispatchRequests(requests,race.snapshot().soundFlags));
  if(requests.some(request=>request.kind==='reset'))view().setUint16(d+0x4e0c,0,true);
  return filter(writes);
 };
 return {
  start(handle:number){return filter(operate(race=>race.start(handle)));},
  impacts(handle:number,flags:number,active:boolean){return filter(operate(race=>race.impacts(handle,flags,active)));},
  crash(handle:number){return filter(operate(race=>race.crash(handle)));},
  update(handle:number,rpm:number,previous:Vector,current:Vector,interval:number){operate(race=>race.update(handle,rpm,previous,current,interval));},
  dispatchRequests:dispatch,
  produce(){return dispatch(produceRaceAudioInPlace(memory(),d).requests);},
  stopEffect(handle:number){
   // Original292F8 releases ownership before stopping the driver's voice.
   // Calling29466 alone leaves a timer busy across a race resource reload.
   if((handle<<16>>16)>=0)memory()[d+((0xa3aa+handle)&65535)]=0;
   const before=state(),next=stopEffect(before,handle,byte(0x9f5a));commit({...before,...next,driverGeneration});return filter(next.writes);
  },
  /** Original independently gated 2a1f0 and 193cd registrations. */
  tick(stackMatches=true){
   let next=state();const writes:number[][]=[];
   if((word(0x4ddc)||word(0x4dde))&&!word(0x4e0c)&&!word(0x4e6a)){
    if(byte(0x4e04)===1&&byte(0x4e03)===1&&byte(0x4e02)===0)throw Error('Menu music must be stopped before race audio ticks');
    view().setUint16(d+0x4e6a,1,true);
    const audio=stepEffectRuntime(next,resources);next={...next,...audio};writes.push(...audio.writes);
    view().setUint16(d+0x4e6a,word(0x4e6a)-1,true);
   }
   const cars=stepCarAudioRecords({...next,car:next.cars[0]},resources,byte(0x4e05)!==0,byte(0x9f5a),stackMatches);
   commit({...next,...cars,driverGeneration});writes.push(...cars.writes);return filter(writes);
  },
 };
}
import {createEffectTimerBridge} from './effect-timer-extension.ts';
