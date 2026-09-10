import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {impactAudioRuntime} from './impact-audio-runtime.ts';
import {stopEngineRuntime} from './engine-runtime-stop.ts';
import {resetOriginalTandyAudio} from './tandy-audio-reset.ts';
import type {RaceAudioRequest} from './produce-race-audio.ts';
import {startCrashRuntime} from './crash-runtime.ts';
import {setOriginalTandyEffectsEnabled} from './tandy-effect-mute.ts';
import {exitOriginalTandyRaceAudio} from './tandy-race-audio-exit.ts';
import type {DrivingAudioExitState} from './driving-audio-exit.ts';
import {startOriginalTandyEngine,type OriginalTandyEngineState} from './tandy-engine-start.ts';
import {stepOriginalTandyCarInterrupt} from './tandy-engine-interrupt.ts';
import {updateOriginalTandyDrivingSounds} from './tandy-driving-sound-runtime.ts';
import {updateOriginalTandySkid} from './tandy-skid-runtime.ts';
import {updateCarAudioTarget} from './car-audio-target.ts';
import type {LoadedEffectResource} from './effect-runtime.ts';
import type {Vector} from '../physics/math.ts';
export type OriginalTandyRaceState=Omit<OriginalTandyEngineState,'car'>&{cars:Uint8Array[];markers:Uint8Array;busy:number[];carCounter:number;soundFlags:number[]};
/** Car-handle operations over one original driver, timer pool and voice pool.
 * The caller owns allocation and the original ordering of game requests.
 */
export function createOriginalTandyRaceAudio(before:OriginalTandyRaceState,resources:LoadedEffectResource[],port61:number,driverSegment:number,enabled=true,master=127){
 let state=structuredClone(before);const biosRequests:OriginalTandyBiosSound[]=[];
 const output=(writes:number[][],bios:OriginalTandyBiosSound[]=[])=>{biosRequests.push(...bios);for(const [port,value] of writes)if(port===0x61)port61=value;return writes;};
 const carAt=(handle:number)=>{const car=state.cars[handle];if(!car)throw Error('Missing original car audio handle');return car;};
 const instrumentAt=(car:Uint8Array)=>{
  const v=new DataView(car.buffer,car.byteOffset,car.byteLength),offset=v.getUint16(0x24,true),segment=v.getUint16(0x26,true);
  const resource=resources.find(r=>r.instrumentOffset===offset&&r.instrumentSegment===segment);
  if(!resource)throw Error('Missing original car engine instrument');return resource.instrument;
 };
 const apply=(handle:number,next:Omit<OriginalTandyEngineState,'command'>&{command?:Uint8Array;writes:number[][];bios?:OriginalTandyBiosSound[]})=>{
  const cars=state.cars.slice();cars[handle]=next.car;
  const {car:_,writes,bios,...shared}=next;
  state={...state,...shared,cars,soundFlags:state.soundFlags};return output(writes,bios);
 };
 return {
  setEnabled(value:boolean,savedVolumes:Uint8Array){
   const next=setOriginalTandyEffectsEnabled({...state,enabled:enabled?1:0,savedVolumes},value);
   const {writes,savedVolumes:restored,enabled:nextEnabled,...audio}=next;
   state={...state,...audio};enabled=nextEnabled===1;return {writes,savedVolumes:restored,enabled:nextEnabled};
  },
  start(handle:number){const car=carAt(handle);return apply(handle,startOriginalTandyEngine({...state,car},instrumentAt(car),driverSegment,port61));},
  impacts(handle:number,flags:number,active:boolean){return apply(handle,impactAudioRuntime({...state,car:carAt(handle)},flags,active,resources,enabled,master));},
  crash(handle:number){return apply(handle,startCrashRuntime({...state,car:carAt(handle)},resources,enabled,master));},
  skid(handle:number,variant:1|2|'stop'){return apply(handle,updateOriginalTandySkid({...state,car:carAt(handle)},variant,resources,enabled,master,driverSegment,port61));},
  driveSounds(handle:number,flags:number){
   const next=updateOriginalTandyDrivingSounds({...state,car:carAt(handle),soundFlags:state.soundFlags[handle]??0},flags,resources,enabled,master,driverSegment,port61);
   const previousFlags=state.soundFlags.slice();previousFlags[handle]=next.soundFlags;
   const writes=apply(handle,next);state.soundFlags=previousFlags;return writes;
  },
  update(handle:number,rpm:number,previous:Vector,current:Vector,interval:number){
   const car=carAt(handle),instrument=instrumentAt(car),cars=state.cars.slice();
   cars[handle]=updateCarAudioTarget(car,rpm,previous,current,interval,instrument[14],instrument[15]);state={...state,cars};
  },
  tick(incomingCx:number){
   const next=stepOriginalTandyCarInterrupt({...state,car:carAt(0)},resources,enabled,port61,driverSegment,incomingCx,master);
   const {writes,bios,...retained}=next;state={...state,...retained};return output(writes,bios);
  },
  exit(queue:DrivingAudioExitState){
   const {audio,queue:nextQueue}=exitOriginalTandyRaceAudio({...state,paused:0},queue,resources,enabled,master,port61,driverSegment);
   const {writes,bios,...next}=audio;state=next;return {writes:output(writes,bios),queue:nextQueue};
  },
  /** Execute already-decoded producer requests once, preserving their order.
   * The supplied final flags are indexed by original car handle and come from
   * the producer memory, so replay exit does not recompute transitions.
   */
  dispatchRequests(requests:readonly RaceAudioRequest[],soundFlags:readonly number[]){
   const writes:number[][]=[];
   for(const request of requests){
    if(request.kind==='reset'){
     const {writes:resetWrites,bios:resetBios,...next}=resetOriginalTandyAudio({...state,paused:0},port61,driverSegment);state={...state,...next};writes.push(...output(resetWrites,resetBios));continue;
    }
    if(request.handle===undefined)throw Error('Missing original audio request handle');
    const handle=request.handle,car=carAt(handle);
    if(request.kind==='engine-start')writes.push(...apply(handle,startOriginalTandyEngine({...state,car},instrumentAt(car),driverSegment,port61)));
    else if(request.kind==='engine-stop')writes.push(...apply(handle,stopEngineRuntime({...state,car})));
    else writes.push(...apply(handle,updateOriginalTandySkid({...state,car},request.kind==='skid-start'?1:request.kind==='skid2-start'?2:'stop',resources,enabled,master,driverSegment,port61)));
   }
   state.soundFlags=[...soundFlags];return writes;
  },
  speakerPort(){return port61;},
  /** Host DAC requests are drained explicitly; port writes alone are not complete output. */
  takeBiosRequests(){return biosRequests.splice(0);},
  snapshot(){return structuredClone(state);},
 };
}
