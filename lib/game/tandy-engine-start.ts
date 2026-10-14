import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {runEngineAudioStart,type EngineStartCall} from './engine-start.ts';
import {startOriginalTandyAllocatedNote,runOriginalTandyAllocatedNote} from './tandy-note-start.ts';
import {setOriginalTandyVolume,assignOriginalTandyInstrument,originalTandyVolumeGateWrites} from './tandy-control.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export interface OriginalTandyEngineState {car:Uint8Array;timers:Uint8Array[];voices:Uint8Array[];lastNotes:Uint8Array;command:Uint8Array;driver:Uint8Array;driverGeneration?:PhysicsEngineVersion;}
export type OriginalTandySampleResolver=Parameters<typeof startOriginalTandyAllocatedNote>[4];
/** Original engine wrapper, continuous-note start and volume assignment with
 * TD15 callbacks, including retained track volume on instrument assignment. */
export function startOriginalTandyEngine(before:OriginalTandyEngineState,instrument:Uint8Array,driverSegment:number,port61:number,sampleAt?:Parameters<typeof startOriginalTandyAllocatedNote>[4]){
 const program=runOriginalTandyEngineStart(before,instrument,driverSegment,port61,false,sampleAt);let step=program.next();while(!step.done)step=program.next();return step.value;
}
export function* runOriginalTandyEngineStart(before:OriginalTandyEngineState,instrument:Uint8Array,driverSegment:number,port61:number,deferLegacyBios=false,sampleAt?:Parameters<typeof startOriginalTandyAllocatedNote>[4]){
 let timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),lastNotes=before.lastNotes.slice(),driver=before.driver.slice();const writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];const command=before.command.slice(),view=(b:Uint8Array)=>new DataView(b.buffer,b.byteOffset,b.byteLength);
 const gate=(channel:number,volume:number)=>{const gated=originalTandyVolumeGateWrites(channel,volume,port61,before.driverGeneration);writes.push(...gated);for(const [port,value] of gated)if(port===0x61)port61=value;};
 const dispatch=(call:EngineStartCall):number|void=>{
  if(call.kind==='instrument'){const [owner,offset,segment]=call.args,timer=timers[owner];view(timer).setUint16(0x1e,offset,true);view(timer).setUint16(0x20,segment,true);timer[0x47]=instrument[0x43]<16?instrument[0x43]:(owner&15)+1;for(let i=0;i<voices.length;i++)if(voices[i][0]===owner){assignOriginalTandyInstrument(driver,i,timer,before.driverGeneration);gate(i,timer[0x28]);}}
  else if(call.kind==='note'){const [pitch,owner]=call.args,c=view(command);c.setUint32(0,pitch,true);command[4]=255;c.setUint32(6,0xffffffe0,true);const started=startOriginalTandyAllocatedNote({alternate:false,channelMasks:[1,2,4,8,16,32],owner,instrument,timers,voices,lastNotes,command},driver,driverSegment,port61,sampleAt,before.driverGeneration);({timers,voices,lastNotes,driver}=started);writes.push(...started.writes);bios.push(...started.bios);for(const [port,value] of started.writes)if(port===0x61)port61=value;return started.voice;}
  else{const [owner,volume]=call.args;timers[owner][0x28]=volume;for(let i=0;i<voices.length;i++)if(voices[i][0]===owner){setOriginalTandyVolume(driver,i,volume,before.driverGeneration);gate(i,volume);}}
 };
 const engineProgram=runEngineAudioStart(before.car,instrument);let engineStep=engineProgram.next();
 try{while(!engineStep.done){
  const call=engineStep.value.call;let voice:number|void;
  if(call.kind==='note'&&deferLegacyBios){
   const [pitch,owner]=call.args,c=view(command);c.setUint32(0,pitch,true);command[4]=255;c.setUint32(6,0xffffffe0,true);
   const program=runOriginalTandyAllocatedNote({alternate:false,channelMasks:[1,2,4,8,16,32],owner,instrument,timers,voices,lastNotes,command},driver,driverSegment,port61,sampleAt,before.driverGeneration,'reject',true);let step=program.next(),emittedWrites=0,emittedBios=0;
   try{while(!step.done){
    writes.push(...step.value.writes.slice(emittedWrites));bios.push(...step.value.bios.slice(emittedBios));emittedWrites=step.value.writes.length;emittedBios=step.value.bios.length;
    const resumed:{driver:Uint8Array;port61:number}|undefined=yield {state:{...before,...step.value.state,command,car:engineStep.value.record},writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request})),port61:step.value.port61};
    step=program.next(resumed);
   }}finally{program.return(undefined as never);}
   const started=step.value;({timers,voices,lastNotes,driver}=started);writes.push(...started.writes.slice(emittedWrites));bios.push(...started.bios.slice(emittedBios));for(const [port,value] of started.writes)if(port===0x61)port61=value;voice=started.voice;
  }else voice=dispatch(call);
  engineStep=engineProgram.next(voice);
 }}finally{engineProgram.return(undefined as never);}
 const car=engineStep.value;
 return {car,timers,voices,lastNotes,driver,command,writes,bios,...(before.driverGeneration===undefined?{}:{driverGeneration:before.driverGeneration})};
}
