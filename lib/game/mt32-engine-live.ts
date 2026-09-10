import {stepCarAudioTick} from './car-audio-tick.ts';
import {applyOriginalMt32DriverControl} from './mt32-driver-control.ts';
import type {OriginalMt32EngineState} from './mt32-engine-start.ts';
/** One running car iteration; the enclosing alternate-driver cadence is
 * separate. Pitch writes MIDI bend immediately instead of retaining an OPL
 * or PSG divisor for the following hardware-voice tick. */
export function updateOriginalMt32EngineLive(before:OriginalMt32EngineState,enabled:boolean){
 const update=stepCarAudioTick(before.car,enabled,false,0),driver=before.driver.slice();
 const timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),writes:number[][]=[];
 const emptyVoice=new Uint8Array(46),emptyPatch=new Uint8Array(100);
 for(const call of update.calls){
  if(call.kind==='volume'){
   const [owner,volume]=call.args,timer=timers[owner];if(!timer)throw Error('Missing original MT15 live-volume timer');
   timer[0x28]=volume;writes.push(...applyOriginalMt32DriverControl('volume',timer[0x47],emptyVoice,emptyPatch,volume).writes);
  }else if(call.kind==='pitch'){
   const [index,frequency]=call.args,record=voices[index];if(!record)throw Error('Missing original MT15 live-pitch voice');
   writes.push(...applyOriginalMt32DriverControl('frequency',record[44],record,emptyPatch,frequency).writes);
  }else throw Error(`MT15 engine transition ${call.kind} requires its original runtime adapter`);
 }
 return {...before,car:update.record,timers,voices,driver,writes};
}
