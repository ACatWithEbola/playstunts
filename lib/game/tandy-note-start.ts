import {startMs91TandyNote} from './ms91-tandy-note.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {runNoteStart,type NoteStartInput,type NoteDriverCall,type NoteDriverContext} from './note-start.ts';
import {assignOriginalTandyInstrument,setOriginalTandyFrequency,originalTandyVolumeGateWrites} from './tandy-control.ts';
import {startOriginalTandyNote} from './tandy-note.ts';
import {stopOriginalTandyChannel,runOriginalTandyChannelStop} from './tandy-lifecycle.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
/** Original2A96A with TD15 callbacks. The final call sets CX to the signed
 * patch transpose and DX to the driver segment at2AB90/2ABAB. */
export function startOriginalTandyAllocatedNote(input:NoteStartInput,before:Uint8Array,driverSegment:number,port61:number,sampleAt?:(offset:number,segment:number)=>{offset:number;segment:number;length:number},generation?:PhysicsEngineVersion,sampleDelivery:'reject'|'deferred'='reject'){
 const program=runOriginalTandyAllocatedNote(input,before,driverSegment,port61,sampleAt,generation,sampleDelivery);let step=program.next();while(!step.done)step=program.next();return step.value;
}
export function* runOriginalTandyAllocatedNote(input:NoteStartInput,before:Uint8Array,driverSegment:number,port61:number,sampleAt?:(offset:number,segment:number)=>{offset:number;segment:number;length:number},generation?:PhysicsEngineVersion,sampleDelivery:'reject'|'deferred'='reject',deferLegacyBios=false){
 if(input.alternate)throw Error('TD15 requires regular output mode');const driver=before.slice(),writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 const sampleStarts:NonNullable<ReturnType<typeof startMs91TandyNote>>[]=[];
 const dispatch=(call:NoteDriverCall,context:NoteDriverContext)=>{
  const channel=call.args[0],record=context.voices[(call.args[1]-0xa036)/46];if(!record)throw Error('Invalid original Tandy voice pointer');
  if(call.offset===12)return;
  if(call.offset===15){const stopped=stopOriginalTandyChannel(driver,driverSegment,channel,port61,generation);writes.push(...stopped.writes);bios.push(...stopped.bios);for(const [port,value] of stopped.writes)if(port===0x61)port61=value;return;}
  if(call.offset===33){const timer=context.timers[(call.args[2]-0x801e)/72];assignOriginalTandyInstrument(driver,channel,timer,generation);const gated=originalTandyVolumeGateWrites(channel,timer[0x28],port61,generation);writes.push(...gated);for(const [port,value] of gated)if(port===0x61)port61=value;return;}
  if(call.offset===36){setOriginalTandyFrequency(record,channel,call.args[2],generation);return;}
  if(call.offset===9){
   const transpose=input.instrument[16]<<24>>24,note=call.args[3]&255,usesSample=note===255?transpose===0:channel===0;
   if(generation==='ms-1991'){const request=startMs91TandyNote(driver,channel,record,input.instrument,note,call.args[4],transpose,driverSegment);if(request){if(sampleDelivery!=='deferred')throw Error('Modern Tandy sampled instrument requires its sample host');sampleStarts.push(request);}return;}
   const pointer=new DataView(input.instrument.buffer,input.instrument.byteOffset,input.instrument.byteLength);
   const sample=usesSample?sampleAt?.(pointer.getUint16(6,true),pointer.getUint16(8,true)):undefined;
   startOriginalTandyNote(driver,channel,record,input.instrument,note,call.args[4],transpose,driverSegment,sample);return;
  }
  throw Error('Unreconstructed Tandy note callback');
 };
 const noteProgram=runNoteStart(input);let noteStep=noteProgram.next();
 try{while(!noteStep.done){
  const {call,context}=noteStep.value;
  if(call.offset===15&&deferLegacyBios){
   const stop=runOriginalTandyChannelStop(driver,driverSegment,call.args[0],port61,generation,true);let step=stop.next(),emittedBios=0;
   try{while(!step.done){
    bios.push(...step.value.bios);emittedBios+=step.value.bios.length;
    const resumed:{driver:Uint8Array;port61:number}|undefined=yield {state:{timers:context.timers,voices:context.voices,lastNotes:context.lastNotes,driver,driverGeneration:generation},sampleStarts:[],writes:writes.map(write=>write.slice()),bios:bios.map(request=>({...request})),port61};
    if(resumed){if(!Number.isInteger(resumed.port61)||resumed.port61<0||resumed.port61>255)throw Error('Invalid resumed Tandy note port');port61=resumed.port61;}
    step=stop.next(resumed?.driver);
   }
   const stopped=step.value;writes.push(...stopped.writes);bios.push(...stopped.bios.slice(emittedBios));for(const [port,value] of stopped.writes)if(port===0x61)port61=value;
   }finally{stop.return(undefined as never);}
  }else dispatch(call,context);
  noteStep=noteProgram.next();
 }}finally{noteProgram.return(undefined as never);}
 const result=noteStep.value;
 // An explicit full-host caller commits returned driver/voice state before
 // delivering these requests at its owning IRQ position. Tone callers reject.
 return {...result,driver,writes,bios,sampleStarts};
}
