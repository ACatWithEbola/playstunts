import {createAllocatedMt32RaceAudio} from './allocated-mt32-race-audio.ts';
import {controlAllocatedMt32DialogAudio} from './allocated-mt32-dialog-audio.ts';
import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
import {createAllocatedRaceAudio} from './allocated-race-audio.ts';
import {createAllocatedPcSpeakerRaceAudio} from './allocated-pc-speaker-race-audio.ts';
import {controlAllocatedDialogAudio} from './allocated-dialog-audio.ts';
import {controlAllocatedPcSpeakerDialogAudio} from './allocated-pc-speaker-dialog-audio.ts';
import {createAllocatedTandyRaceAudio} from './allocated-tandy-race-audio.ts';
import {controlAllocatedTandyDialogAudio} from './allocated-tandy-dialog-audio.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
export type NativeRaceSoundDevice = {kind:'mt32';
 /** Internal ready-output race adapter; explicit host handles initialization
  * and SysEx I/O. This does not provide a Roland synthesizer. */
 execute(program:OriginalMt32MpuProgram):{result:number;writes:number[][]};
 executeInitialization?(program:OriginalMt32MpuProgram):Promise<{result:number;writes:number[][]}>;
}|{kind:'pc-speaker';port61():number}|{
 kind:'tandy';port61():number;interruptCx():number;
 /** Requests are explicit host work. The owner supplies timing and callback
  * delivery; accepting a batch does not imply instantaneous BIOS execution. */
 bios(requests:OriginalTandyBiosSound[],memory:Uint8Array):void;
};
/** Device selection is retained by the outer session across replay/race reloads. */
export function createNativeAllocatedSound(memory:()=>Uint8Array,d:number,driverSegment:number,device?:NativeRaceSoundDevice){
 if(device?.kind==='mt32')return createAllocatedMt32RaceAudio(memory,d,driverSegment);
 if(device?.kind==='tandy'){
  const audio=createAllocatedTandyRaceAudio(memory,d,driverSegment,device.port61,device.interruptCx);
  const collect=<T>(operation:()=>T)=>{const result=operation(),requests=audio.takeBiosRequests();if(requests.length)device.bios(requests,memory());return result;};
  return {...audio,
   start:(...args:Parameters<typeof audio.start>)=>collect(()=>audio.start(...args)),
   impacts:(...args:Parameters<typeof audio.impacts>)=>collect(()=>audio.impacts(...args)),
   crash:(...args:Parameters<typeof audio.crash>)=>collect(()=>audio.crash(...args)),
   dispatchRequests:(...args:Parameters<typeof audio.dispatchRequests>)=>collect(()=>audio.dispatchRequests(...args)),
   produce:()=>collect(()=>audio.produce()),
   stopEffect:(...args:Parameters<typeof audio.stopEffect>)=>collect(()=>audio.stopEffect(...args)),
   tick:(...args:Parameters<typeof audio.tick>)=>collect(()=>audio.tick(...args)),
  };
 }
 return device?.kind==='pc-speaker'?createAllocatedPcSpeakerRaceAudio(memory,d,driverSegment,device.port61):createAllocatedRaceAudio(memory,d,driverSegment);
}
export function controlNativeAllocatedDialogSound(memory:Uint8Array,d:number,driverSegment:number,operation:'pause-audio'|'resume-audio',device?:NativeRaceSoundDevice){
 if(device?.kind==='mt32')return device.execute(controlAllocatedMt32DialogAudio(memory,d,driverSegment,operation)).writes;
 if(device?.kind==='tandy'){const output=controlAllocatedTandyDialogAudio(memory,d,driverSegment,operation,device.port61());if(output.bios.length)device.bios(output.bios,memory);return output.writes;}
 return device?.kind==='pc-speaker'?controlAllocatedPcSpeakerDialogAudio(memory,d,driverSegment,operation,device.port61()):controlAllocatedDialogAudio(memory,d,driverSegment,operation);
}
