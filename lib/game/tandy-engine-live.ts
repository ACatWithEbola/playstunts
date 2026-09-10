import {stepCarAudioTick} from './car-audio-tick.ts';
import {setOriginalTandyVolume,setOriginalTandyFrequency} from './tandy-control.ts';
import type {OriginalTandyEngineState} from './tandy-engine-start.ts';
/** Running-engine car iteration with live TD15 volume/pitch operations.
 * Startup/stop transitions remain explicit unsupported requests in this adapter.
 */
export function updateOriginalTandyEngineLive(before:OriginalTandyEngineState,enabled:boolean){
 const update=stepCarAudioTick(before.car,enabled,false,0);
 const driver=before.driver.slice();
 const timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),writes:number[][]=[];
 for(const call of update.calls){
  if(call.kind==='volume'){
   const [owner,volume]=call.args;
   if(!timers[owner])throw Error('Missing original live-volume timer');
   timers[owner][0x28]=volume;
   for(let index=0;index<voices.length;index++)if(voices[index][0]===owner)setOriginalTandyVolume(driver,index,volume);
  }else if(call.kind==='pitch'){
   const [index,frequency]=call.args,record=voices[index];
   if(!record)throw Error('Missing original live-pitch voice');
   setOriginalTandyFrequency(record,record[0x2c],frequency);
  }else throw Error(`Engine transition ${call.kind} needs its original runtime adapter`);
 }
 return {...before,car:update.record,timers,voices,driver,writes};
}
