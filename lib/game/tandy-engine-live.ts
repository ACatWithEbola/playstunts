import {stepCarAudioTick} from './car-audio-tick.ts';
import {setOriginalTandyVolume,setOriginalTandyFrequency,originalTandyVolumeGateWrites} from './tandy-control.ts';
import type {OriginalTandyEngineState} from './tandy-engine-start.ts';
/** Running-engine car iteration with live TD15 volume/pitch operations.
 * Startup/stop transitions remain explicit unsupported requests in this adapter.
 */
export function updateOriginalTandyEngineLive(before:OriginalTandyEngineState,enabled:boolean,port61?:number){
 const update=stepCarAudioTick(before.car,enabled,false,0);
 const driver=before.driver.slice();
 const timers=before.timers.map(t=>t.slice()),voices=before.voices.map(v=>v.slice()),writes:number[][]=[];
 for(const call of update.calls){
  if(call.kind==='volume'){
   const [owner,volume]=call.args;
   if(!timers[owner])throw Error('Missing original live-volume timer');
   timers[owner][0x28]=volume;
   for(let index=0;index<voices.length;index++)if(voices[index][0]===owner){setOriginalTandyVolume(driver,index,volume,before.driverGeneration);
    if(before.driverGeneration==='ms-1991'&&index===5&&(volume&255)<8){if(port61===undefined)throw Error('Modern Tandy engine volume requires current port61');const gated=originalTandyVolumeGateWrites(index,volume,port61,before.driverGeneration);writes.push(...gated);port61=gated[0][1];}
   }
  }else if(call.kind==='pitch'){
   const [index,frequency]=call.args,record=voices[index];
   if(!record)throw Error('Missing original live-pitch voice');
   setOriginalTandyFrequency(record,record[0x2c],frequency,before.driverGeneration);
  }else throw Error(`Engine transition ${call.kind} needs its original runtime adapter`);
 }
 return {...before,car:update.record,timers,voices,driver,writes};
}
