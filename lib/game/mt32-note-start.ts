import {startNote,type NoteStartInput} from './note-start.ts';
import {applyOriginalMt32DriverControl,type OriginalMt32Control} from './mt32-driver-control.ts';

/** Complete game2A96A using MT15's alternate16-record allocation mode.
 * The hardware MIDI channel is retained separately from the allocated voice
 * index. MT15:000F is a no-op; release000C emits the old note-off. */
export function startOriginalMt32AllocatedNote(input:NoteStartInput){
 if(!input.alternate)throw Error('MT15 note allocation requires alternate output mode');
 const writes:number[][]=[];
 const result=startNote(input,(call,context)=>{
  const record=context.voices[(call.args[1]-0xa036)/46];
  if(!record)throw Error('Invalid original MT15 voice pointer');
  let kind:OriginalMt32Control,value=0,extra=0;
  if(call.offset===12)kind='release';
  else if(call.offset===15)kind='noop';
  else if(call.offset===36){kind='frequency';value=call.args[2];}
  else if(call.offset===9){kind='note';value=call.args[3];extra=call.args[4];}
  else throw Error('Unreconstructed MT15 note callback');
  writes.push(...applyOriginalMt32DriverControl(kind,call.args[0],record,context.instrument,value,extra).writes);
 });
 return {...result,writes};
}
