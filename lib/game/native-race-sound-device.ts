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
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {runTandySampleContinuation} from './run-tandy-sample-continuation.ts';
export type NativeRaceSoundDevice = {kind:'mt32';
 driverGeneration?:PhysicsEngineVersion;
 /** Internal ready-output race adapter; explicit host handles initialization
  * and SysEx I/O. This does not provide a Roland synthesizer. */
 execute(program:OriginalMt32MpuProgram):{result:number;writes:number[][]};
 executeInitialization?(program:OriginalMt32MpuProgram):Promise<{result:number;writes:number[][]}>;
}|{kind:'adlib';driverGeneration?:PhysicsEngineVersion}|{kind:'pc-speaker';port61():number;sampleIo?:{interruptMask():number}}|{
 kind:'tandy';driverGeneration?:PhysicsEngineVersion;port61():number;interruptCx():number;
 /** Requests are explicit host work. The owner supplies timing and callback
  * delivery; accepting a batch does not imply instantaneous BIOS execution. */
 bios(requests:OriginalTandyBiosSound[],memory:Uint8Array):void;
 /** Modern full-host delivery after committed state; owner supplies actual
  * IRQ position and prior-transfer completion, never an implicit tone fallback. */
 sampleStarts?(requests:ReturnType<ReturnType<typeof createAllocatedTandyRaceAudio>['takeSampleStartRequests']>,memory:Uint8Array):void;
};
/** Device selection is retained by the outer session across replay/race reloads. */
export function createNativeAllocatedSound(memory:()=>Uint8Array,d:number,driverSegment:number,device?:NativeRaceSoundDevice,effectEngine?:PhysicsEngineVersion){
 if(device?.kind==='mt32')return createAllocatedMt32RaceAudio(memory,d,driverSegment,device.driverGeneration,effectEngine);
 if(device?.kind==='tandy'){
  if(device.sampleStarts&&device.driverGeneration!=='ms-1991')throw Error('Deferred Tandy sample starts require the modern full host');
  const audio=createAllocatedTandyRaceAudio(memory,d,driverSegment,device.port61,device.interruptCx,device.driverGeneration,effectEngine,device.sampleStarts?'deferred':'reject');
  const collect=<T>(operation:()=>T)=>{const result=operation(),requests=audio.takeBiosRequests();if(requests.length)device.bios(requests,memory());const starts=audio.takeSampleStartRequests();if(starts.length)device.sampleStarts!(starts,memory());return result;};
  return {...audio,
   async tickWithSampleWait(owner:Omit<Parameters<typeof runTandySampleContinuation>[1],'bios'>,signal?:AbortSignal,stackMatches=true){
    if(!device.sampleStarts||device.driverGeneration!=='ms-1991')throw Error('Sample continuation requires modern full Tandy host');
    return runTandySampleContinuation(audio.tickProgram(stackMatches),{
     write:writes=>owner.write(writes),replaceSample:(request,signal)=>owner.replaceSample(request,signal),
     bios(requests){if(requests.length)device.bios(requests,memory());},
    },signal);
   },
   start:(...args:Parameters<typeof audio.start>)=>collect(()=>audio.start(...args)),
   impacts:(...args:Parameters<typeof audio.impacts>)=>collect(()=>audio.impacts(...args)),
   crash:(...args:Parameters<typeof audio.crash>)=>collect(()=>audio.crash(...args)),
   dispatchRequests:(...args:Parameters<typeof audio.dispatchRequests>)=>collect(()=>audio.dispatchRequests(...args)),
   produce:()=>collect(()=>audio.produce()),
   stopEffect:(...args:Parameters<typeof audio.stopEffect>)=>collect(()=>audio.stopEffect(...args)),
   tick:(...args:Parameters<typeof audio.tick>)=>collect(()=>audio.tick(...args)),
  };
 }
 return device?.kind==='pc-speaker'?createAllocatedPcSpeakerRaceAudio(memory,d,driverSegment,device.port61,device.sampleIo,effectEngine):createAllocatedRaceAudio(memory,d,driverSegment,device?.kind==='adlib'?device.driverGeneration:undefined,effectEngine);
}
export function controlNativeAllocatedDialogSound(memory:Uint8Array,d:number,driverSegment:number,operation:'pause-audio'|'resume-audio',device?:NativeRaceSoundDevice){
 if(device?.kind==='mt32')return device.execute(controlAllocatedMt32DialogAudio(memory,d,driverSegment,operation,device.driverGeneration)).writes;
 if(device?.kind==='tandy'){const output=controlAllocatedTandyDialogAudio(memory,d,driverSegment,operation,device.port61(),device.driverGeneration);if(output.bios.length)device.bios(output.bios,memory);return output.writes;}
 return device?.kind==='pc-speaker'?controlAllocatedPcSpeakerDialogAudio(memory,d,driverSegment,operation,device.port61()):controlAllocatedDialogAudio(memory,d,driverSegment,operation,device?.kind==='adlib'?device.driverGeneration:undefined);
}
