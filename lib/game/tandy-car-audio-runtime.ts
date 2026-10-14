import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {updateOriginalTandyEngineLive} from './tandy-engine-live.ts';
import {runOriginalTandyEngineStart,type OriginalTandyEngineState,type OriginalTandySampleResolver} from './tandy-engine-start.ts';
import {runOriginalTandyEffectStop} from './tandy-effect-stop.ts';
import {effectFinished} from './effect-finished.ts';
/** Full player car callback including the original deferred transition at
 * 0x194d6-0x19535. Smoothing precedes effect cleanup or engine restart.
 */
export function updateOriginalTandyCarAudio<T extends OriginalTandyEngineState&{markers:Uint8Array}>(before:T,enabled:boolean,master:number,instrumentAt:(offset:number,segment:number)=>Uint8Array,driverSegment:number,port61:number,sampleAt?:OriginalTandySampleResolver){
 const program=runOriginalTandyCarAudio(before,enabled,master,instrumentAt,driverSegment,port61,false,sampleAt);let step=program.next();while(!step.done)step=program.next();return step.value;
}
export function* runOriginalTandyCarAudio<T extends OriginalTandyEngineState&{markers:Uint8Array}>(before:T,enabled:boolean,master:number,instrumentAt:(offset:number,segment:number)=>Uint8Array,driverSegment:number,port61:number,deferLegacyBios=false,sampleAt?:OriginalTandySampleResolver){
 const pending=before.car[27];const car=before.car.slice();car[27]=0;
 const smooth=updateOriginalTandyEngineLive({...before,car},enabled,port61);
 for(const [port,value] of smooth.writes)if(port===0x61)port61=value;
 let state={...before,...smooth};state.car[27]=pending;
 const writes=smooth.writes.slice(),bios:OriginalTandyBiosSound[]=[];
 if(enabled&&state.car[0]&&pending){
  const v=new DataView(state.car.buffer),handle=v.getUint16(20,true);
  if(state.car[1]){
   const program=runOriginalTandyEffectStop(state,handle,master,driverSegment,port61,deferLegacyBios);let step=program.next(),emittedWrites=0,emittedBios=0;
   try{while(!step.done){
    writes.push(...step.value.writes.slice(emittedWrites));bios.push(...step.value.bios.slice(emittedBios));emittedWrites=step.value.writes.length;emittedBios=step.value.bios.length;
    const resumed:{driver:Uint8Array;port61:number}|undefined=yield {state:{...state,...step.value.state},writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request})),port61:step.value.port61};
    step=program.next(resumed);
   }}finally{program.return(undefined as never);}
   const stopped=step.value;state={...state,...stopped};writes.push(...stopped.writes.slice(emittedWrites));bios.push(...stopped.bios.slice(emittedBios));state.car[27]=0;
  }else if(effectFinished(state.timers,handle,1)){
   const program=runOriginalTandyEngineStart(state,instrumentAt(v.getUint16(0x24,true),v.getUint16(0x26,true)),driverSegment,port61,deferLegacyBios,sampleAt);let step=program.next(),emittedWrites=0,emittedBios=0;
   try{while(!step.done){
    writes.push(...step.value.writes.slice(emittedWrites));bios.push(...step.value.bios.slice(emittedBios));emittedWrites=step.value.writes.length;emittedBios=step.value.bios.length;
    const resumed:{driver:Uint8Array;port61:number}|undefined=yield {state:{...state,...step.value.state},writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request})),port61:step.value.port61};
    step=program.next(resumed);
   }}finally{program.return(undefined as never);}
   const started=step.value;
   state={...state,...started};writes.push(...started.writes.slice(emittedWrites));bios.push(...started.bios.slice(emittedBios));state.car[27]=0;
  }
 }
 return {...state,writes,bios};
}
