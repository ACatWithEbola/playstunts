import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {createOriginalTandyRaceAudio} from './tandy-race-audio.ts';
import {readOriginalTandyRaceState,writeOriginalTandyRaceState} from './tandy-race-audio-memory.ts';
import {readOriginalCarSoundResources} from './read-car-sound-resources.ts';
import {stepOriginalTandyEffects,runOriginalTandyEffects} from './tandy-effect-runtime.ts';
import {stepOriginalTandyCarRecords,runOriginalTandyCarRecords} from './tandy-engine-interrupt.ts';
import {produceRaceAudioInPlace,type RaceAudioRequest} from './produce-race-audio.ts';
import {stopOriginalTandyEffect} from './tandy-effect-stop.ts';
import type {Vector} from '../physics/math.ts';
import {readTandySampleResource} from './read-tandy-sample-resource.ts';
/** One allocated race's regular TD15 resources and live memory state.
 * Construct after allocation and music shutdown; discard before freeing banks. */
export function createAllocatedTandyRaceAudio(memory:()=>Uint8Array,d:number,driverSegment:number,speakerPort:()=>number,interruptCx:()=>number,driverGeneration?:PhysicsEngineVersion,effectEngine?:import('../physics/engine-version.ts').PhysicsEngineVersion,sampleDelivery:'reject'|'deferred'='reject'){
 const biosRequests:OriginalTandyBiosSound[]=[];
 const sampleRequests:ReturnType<typeof stepOriginalTandyEffects>['sampleStarts']=[];
 const view=()=>{const m=memory();return new DataView(m.buffer,m.byteOffset,m.byteLength);};
 const word=(at:number)=>view().getUint16(d+at,true),byte=(at:number)=>memory()[d+at];
 if(byte(0x4e06))throw Error('Allocated race audio requires the regular TD15 driver');
 const handles=[word(0x8016)];if(byte(0x8fc8))handles.push(word(0x86de));
 const resources=readOriginalCarSoundResources(memory(),d,handles);
 const timerBridge=createEffectTimerBridge(effectEngine);
 const commit=(state:Parameters<typeof writeOriginalTandyRaceState>[2])=>timerBridge.write(state,value=>writeOriginalTandyRaceState(memory(),d,value));
 const state=()=>timerBridge.read({...readOriginalTandyRaceState(memory(),d,driverSegment,driverGeneration),effectEngine});
 const sampleAt=(offset:number,segment:number)=>readTandySampleResource(memory(),offset,segment);
 const operate=<T>(operation:(race:ReturnType<typeof createOriginalTandyRaceAudio>)=>T)=>{
  const race=createOriginalTandyRaceAudio(state(),resources,speakerPort(),driverSegment,byte(0x4e05)!==0,byte(0x9f5a));
  const result=operation(race);commit({...race.snapshot(),driverSegment});biosRequests.push(...race.takeBiosRequests());return result;
 };
 const dispatch=(requests:readonly RaceAudioRequest[])=>{
  const writes=operate(race=>race.dispatchRequests(requests,race.snapshot().soundFlags));
  if(requests.some(request=>request.kind==='reset'))view().setUint16(d+0x4e0c,0,true);
  return writes;
 };
 return {
  takeBiosRequests(){return biosRequests.splice(0);},
  /** Full host drains only after tick commits live driver/voice state. */
  takeSampleStartRequests(){return sampleRequests.splice(0);},
  start(handle:number){return operate(race=>race.start(handle));},
  impacts(handle:number,flags:number,active:boolean){return operate(race=>race.impacts(handle,flags,active));},
  crash(handle:number){return operate(race=>race.crash(handle));},
  update(handle:number,rpm:number,previous:Vector,current:Vector,interval:number){operate(race=>race.update(handle,rpm,previous,current,interval));},
  dispatchRequests:dispatch,
  produce(){return dispatch(produceRaceAudioInPlace(memory(),d).requests);},
  stopEffect(handle:number){
   // Original292F8 releases ownership before stopping the driver's voice.
   // Calling29466 alone leaves a timer busy across a race resource reload.
   if((handle<<16>>16)>=0)memory()[d+((0xa3aa+handle)&65535)]=0;
   const before=state(),next=stopOriginalTandyEffect(before,handle,byte(0x9f5a),driverSegment,speakerPort());commit({...before,...next});biosRequests.push(...next.bios);return next.writes;
  },
  /** Original independently gated 2a1f0 and 193cd registrations. */
  *tickProgram(stackMatches=true,deferLegacyBios=false){
   if(deferLegacyBios&&driverGeneration!==undefined&&driverGeneration!=='ms-1990')throw Error('Deferred BIOS work requires the legacy Tandy driver');
   const ownedMemory=memory(),ownedView=new DataView(ownedMemory.buffer,ownedMemory.byteOffset,ownedMemory.byteLength);
   let next=state(),port61=speakerPort();const writes:number[][]=[],pendingBios:OriginalTandyBiosSound[]=[];
   if((word(0x4ddc)||word(0x4dde))&&!word(0x4e0c)&&!word(0x4e6a)){
    if(byte(0x4e04)===1&&byte(0x4e03)===1&&byte(0x4e02)===0)throw Error('Menu music must be stopped before race audio ticks');
    view().setUint16(d+0x4e6a,1,true);
    let program:ReturnType<typeof runOriginalTandyEffects>|undefined;
    let emittedWrites=0,emittedBios=0;
    try{
     program=runOriginalTandyEffects(next,resources,port61,driverSegment,interruptCx(),undefined,sampleDelivery,sampleAt,deferLegacyBios);
     let step=program.next();
     while(!step.done){
      const boundary=step.value;commit({...state(),...boundary.state,driverSegment});
      yield {sampleStarts:boundary.sampleStarts,writes:boundary.writes.slice(emittedWrites),bios:boundary.bios.slice(emittedBios)};
      if(memory()!==ownedMemory)throw Error('Tandy continuation memory replaced while suspended');
      emittedWrites=boundary.writes.length;emittedBios=boundary.bios.length;
      const live=state();step=program.next({driver:live.driver,port61:speakerPort()});
     }
     const audio=step.value;next={...state(),...audio};writes.push(...audio.writes.slice(emittedWrites));pendingBios.push(...audio.bios.slice(emittedBios));port61=audio.port61;
    }finally{program?.return(undefined as never);ownedView.setUint16(d+0x4e6a,ownedView.getUint16(d+0x4e6a,true)-1,true);}
   }
   const carProgram=runOriginalTandyCarRecords({...next,car:next.cars[0]},resources,byte(0x4e05)!==0,port61,driverSegment,byte(0x9f5a),stackMatches,deferLegacyBios,sampleAt);let carStep=carProgram.next(),emittedCarWrites=0,emittedCarBios=0;
   try{while(!carStep.done){
    commit({...next,...carStep.value.state});
    yield {sampleStarts:[],writes:[...writes,...carStep.value.writes.slice(emittedCarWrites)],bios:[...pendingBios,...carStep.value.bios.slice(emittedCarBios)]};
    if(memory()!==ownedMemory)throw Error('Tandy car continuation memory replaced while suspended');
    writes.length=0;pendingBios.length=0;emittedCarWrites=carStep.value.writes.length;emittedCarBios=carStep.value.bios.length;
    carStep=carProgram.next({driver:state().driver,port61:speakerPort()});
   }}finally{carProgram.return(undefined as never);}
   const cars=carStep.value;commit({...next,...cars});writes.push(...cars.writes.slice(emittedCarWrites));pendingBios.push(...cars.bios.slice(emittedCarBios));
   if(deferLegacyBios&&pendingBios.length){
    // Explicit full host services this returned audio boundary before the
    // enclosing race generator advances timers/input/captured physics. This
    // does not claim per-instruction BIOS interleaving inside each voice.
    yield {sampleStarts:[],writes:writes.map(write=>write.slice()),bios:pendingBios.map(request=>({...request}))};
    if(memory()!==ownedMemory)throw Error('Legacy Tandy memory replaced during BIOS continuation');
    return {writes:[] as number[][],bios:[] as OriginalTandyBiosSound[]};
   }
   return {writes,bios:pendingBios};
  },
  tick(stackMatches=true){
   let next=state(),port61=speakerPort();const writes:number[][]=[],pending:typeof sampleRequests=[];
   if((word(0x4ddc)||word(0x4dde))&&!word(0x4e0c)&&!word(0x4e6a)){
    if(byte(0x4e04)===1&&byte(0x4e03)===1&&byte(0x4e02)===0)throw Error('Menu music must be stopped before race audio ticks');
    view().setUint16(d+0x4e6a,1,true);
    try{const audio=stepOriginalTandyEffects(next,resources,port61,driverSegment,interruptCx(),undefined,sampleDelivery,sampleAt);next={...next,...audio};writes.push(...audio.writes);biosRequests.push(...audio.bios);pending.push(...audio.sampleStarts);port61=audio.port61;}
    finally{view().setUint16(d+0x4e6a,word(0x4e6a)-1,true);}
   }
   const cars=stepOriginalTandyCarRecords({...next,car:next.cars[0]},resources,byte(0x4e05)!==0,port61,driverSegment,byte(0x9f5a),stackMatches,sampleAt);
   commit({...next,...cars});sampleRequests.push(...pending);writes.push(...cars.writes);biosRequests.push(...cars.bios);return writes;
  },
 };
}
import {createEffectTimerBridge} from './effect-timer-extension.ts';
