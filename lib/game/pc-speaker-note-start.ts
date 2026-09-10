import {startNote,type NoteStartInput} from './note-start.ts';
import {setOriginalPcSpeakerFrequency,startOriginalPcSpeakerTone,stopOriginalPcSpeakerTone} from './pc-speaker-control.ts';
/** Original allocation/initialization joined to the supplied PC15 melodic calls.
 * CRA2 selects sample slot0 and requires the separate sample driver path. */
export function startOriginalPcSpeakerNote(input:NoteStartInput,driverBefore:Uint8Array){
 if(input.alternate)throw Error('PC speaker adapter requires regular output mode');const driver=driverBefore.slice();
 const result=startNote(input,(call,context)=>{
  const channel=call.args[0],record=context.voices[(call.args[1]-0xa036)/46];if(!record)throw Error('Invalid original PC speaker voice pointer');
  if(call.offset===12||call.offset===33)return;
  if(call.offset===15){stopOriginalPcSpeakerTone(driver,channel);return;}
  if(call.offset===36){setOriginalPcSpeakerFrequency(record,channel,call.args[2]);return;}
  if(call.offset===9){startOriginalPcSpeakerTone(driver,channel,record,call.args[3]);return;}
  throw Error('Unreconstructed PC speaker note callback');
 });
 return {...result,driver};
}
