import {startNote,type NoteStartInput} from './note-start.ts';
import {setOriginalPcSpeakerFrequency,startOriginalPcSpeakerTone,stopOriginalPcSpeakerTone} from './pc-speaker-control.ts';
import {startOriginalPcSpeakerSampleNote,restoreOriginalPcSpeakerSampleTimer,type OriginalPcSpeakerSampleStart,type OriginalPcSpeakerSampleResult} from './pc-speaker-sample.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
export interface PcSpeakerNoteSampleHost {
 physicsEngine?:PhysicsEngineVersion;
 /** Resolve the original instrument's far sample pointer; no guessed patch. */
 resolve(instrument:Uint8Array):Omit<OriginalPcSpeakerSampleStart,'rate'|'repeats'>;
 emit(result:OriginalPcSpeakerSampleResult&{installVector?:{offset:number;segment:number}}):void;
}
/** Original allocation/initialization joined to the supplied PC15 melodic calls.
 * CRA2 selects sample slot0 and requires the separate sample driver path. */
export function startOriginalPcSpeakerNote(input:NoteStartInput,driverBefore:Uint8Array,sampleHost?:PcSpeakerNoteSampleHost){
 if(input.alternate)throw Error('PC speaker adapter requires regular output mode');const driver=driverBefore.slice();
 const result=startNote(input,(call,context)=>{
  const channel=call.args[0],record=context.voices[(call.args[1]-0xa036)/46];if(!record)throw Error('Invalid original PC speaker voice pointer');
  if(call.offset===12||call.offset===33)return;
  if(call.offset===15){
   if(channel===0&&sampleHost)sampleHost.emit(restoreOriginalPcSpeakerSampleTimer(driver,sampleHost.physicsEngine));
   else stopOriginalPcSpeakerTone(driver,channel);
   return;
  }
  if(call.offset===36){setOriginalPcSpeakerFrequency(record,channel,call.args[2]);return;}
  if(call.offset===9){
   if(channel===0&&sampleHost)sampleHost.emit(startOriginalPcSpeakerSampleNote(driver,record,call.args[3],sampleHost.resolve(context.instrument),sampleHost.physicsEngine));
   else startOriginalPcSpeakerTone(driver,channel,record,call.args[3]);
   return;
  }
  throw Error('Unreconstructed PC speaker note callback');
 });
 return {...result,driver};
}
