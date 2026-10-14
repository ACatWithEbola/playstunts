import {createBrowserOwnedTimedMt32Race} from './browser-owned-timed-mt32-race.ts';
import {createTimedAllocatedRaceClock} from './timed-allocated-race-clock.ts';
import {readOriginalMt32RaceState} from './mt32-race-audio-memory.ts';
import type {createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import type {AllocatedRaceDevices} from './advance-allocated-race.ts';
type Runtime=Pick<Awaited<ReturnType<typeof createNativeManualRaceRuntime>>,'session'|'initialWrites'|'initializationWriteCount'|'tickWithAudioDelivery'>;
/** Explicit allocated connector; physical device and timing profile stay owned
 * by selecting host. Runtime getter follows approved replay replacement. */
export async function createBrowserAllocatedTimedMt32Race(context:Parameters<typeof createBrowserOwnedTimedMt32Race>[0],device:Parameters<typeof createBrowserOwnedTimedMt32Race>[1],options:{
 generation:'ms-1990'|'ms-1991';profile:Parameters<typeof createBrowserOwnedTimedMt32Race>[2]['profile'];
 runtime():Runtime;devices():AllocatedRaceDevices;patch:Uint8Array;active():boolean;
 onHardwareTick?:(dispatch:boolean)=>void;
 onScheduled?:Parameters<typeof createBrowserOwnedTimedMt32Race>[2]['onScheduled'];
}){
 const {runtime,devices,generation,profile,patch,active,onHardwareTick}=options;
 const clock=createTimedAllocatedRaceClock(()=>runtime().session.state.memory);
 try{
  const current=runtime();
  const audio=await createBrowserOwnedTimedMt32Race(context,device,{generation,profile,patch,active,onScheduled:options.onScheduled,
   driver:()=>readOriginalMt32RaceState(runtime().session.state.memory,0x2d1a0,0x39e1,generation).driver,
   initialWrites:current.initialWrites.slice(current.initializationWriteCount),
   tick(){throw Error('Allocated timed race requires awaited callback');},
   tickWithDelivery:deliver=>runtime().tickWithAudioDelivery(devices(),deliver),
   onHardwareTick(dispatch){clock.onHardwareTick(dispatch);onHardwareTick?.(dispatch);},
  });
  let closing:Promise<void>|undefined;
  return {...audio,close(){audio.close();clock.close();},closeAsync(){return closing??=audio.closeAsync().finally(()=>clock.close());}};
 }catch(error){clock.close();throw error;}
}
