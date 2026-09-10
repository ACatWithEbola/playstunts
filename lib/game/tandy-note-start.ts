import {startNote,type NoteStartInput} from './note-start.ts';
import {assignOriginalTandyInstrument,setOriginalTandyFrequency} from './tandy-control.ts';
import {startOriginalTandyNote} from './tandy-note.ts';
import {stopOriginalTandyChannel} from './tandy-lifecycle.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
/** Original2A96A with TD15 callbacks. The final call sets CX to the signed
 * patch transpose and DX to the driver segment at2AB90/2ABAB. */
export function startOriginalTandyAllocatedNote(input:NoteStartInput,before:Uint8Array,driverSegment:number,port61:number,sampleAt?:(offset:number,segment:number)=>{offset:number;segment:number;length:number}){
 if(input.alternate)throw Error('TD15 requires regular output mode');const driver=before.slice(),writes:number[][]=[],bios:OriginalTandyBiosSound[]=[];
 const result=startNote(input,(call,context)=>{
  const channel=call.args[0],record=context.voices[(call.args[1]-0xa036)/46];if(!record)throw Error('Invalid original Tandy voice pointer');
  if(call.offset===12)return;
  if(call.offset===15){const stopped=stopOriginalTandyChannel(driver,driverSegment,channel,port61);writes.push(...stopped.writes);bios.push(...stopped.bios);for(const [port,value] of stopped.writes)if(port===0x61)port61=value;return;}
  if(call.offset===33){assignOriginalTandyInstrument(driver,channel,context.timers[(call.args[2]-0x801e)/72]);return;}
  if(call.offset===36){setOriginalTandyFrequency(record,channel,call.args[2]);return;}
  if(call.offset===9){
   const transpose=input.instrument[16]<<24>>24,note=call.args[3]&255,usesSample=note===255?transpose===0:channel===0;
   const pointer=new DataView(input.instrument.buffer,input.instrument.byteOffset,input.instrument.byteLength);
   const sample=usesSample?sampleAt?.(pointer.getUint16(6,true),pointer.getUint16(8,true)):undefined;
   startOriginalTandyNote(driver,channel,record,input.instrument,note,call.args[4],transpose,driverSegment,sample);return;
  }
  throw Error('Unreconstructed Tandy note callback');
 });
 return {...result,driver,writes,bios};
}
