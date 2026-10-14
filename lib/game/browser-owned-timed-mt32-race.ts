import {createOwnedTimedMt32Device} from './owned-timed-mt32-device.ts';
import {initializeTimedMt32Device} from './timed-mt32-startup.ts';
import {createTimedMt32RaceStream} from './timed-mt32-race-stream.ts';
import {createBrowserTimedMt32RaceAudio} from './browser-timed-mt32-race-audio.ts';
import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
import {PC_PIT_INPUT_HZ} from './timer-interrupt.ts';
import {settleMt32Startup} from './mt32-startup-settle.ts';
/** Explicit initialized race owner. Caller must stop music before acquisition
 * and await closeAsync before handing the physical device to results music.
 * No timing profile, engine generation or live driver is inferred. */
export async function createBrowserOwnedTimedMt32Race(context:AudioContext,device:Mt32StereoOutput&{active():boolean},options:{
 generation:'ms-1990'|'ms-1991';profile:Parameters<typeof createOwnedTimedMt32Device>[1];
 driver():Uint8Array;patch:Uint8Array;initialWrites:number[][];tick():number[][];
 active():boolean;onHardwareTick?:(dispatch:boolean)=>void;
 onScheduled?:Parameters<typeof createBrowserTimedMt32RaceAudio>[3];
 tickWithDelivery?:(deliver:(writes:number[][])=>Promise<void>)=>Promise<number[][]>;
}){
 const {generation,driver:liveDriver,tick,active,onHardwareTick,tickWithDelivery}=options;
 if(generation!=='ms-1990'&&generation!=='ms-1991')throw Error('Unsupported timed Roland race driver');
 const profile={...options.profile},patch=Uint8Array.from(options.patch),driver=Uint8Array.from(options.driver());
 const writes=options.initialWrites.map(pair=>pair.slice());
 const owner=createOwnedTimedMt32Device(device,profile);
 try{
  await initializeTimedMt32Device(driver,patch,generation,owner);
  const stream=createTimedMt32RaceStream(owner.output,owner.transport,liveDriver,generation,tick,onHardwareTick,tickWithDelivery);
  try{await stream.writeAsync(writes);}catch(error){await stream.closeAsync();throw error;}
  const initializationLeadFrames=Math.max(0,Math.ceil(owner.now()*device.sampleRate/PC_PIT_INPUT_HZ)-owner.frame);
  const audio=createBrowserTimedMt32RaceAudio(context,stream,active,options.onScheduled);
  let closing:Promise<void>|undefined;
  return {...audio,initializationLeadFrames,close(){audio.close();owner.close();},closeAsync(){return closing??=(async()=>{
   try{await audio.closeAsync();}finally{owner.close();}
   // Ownership cleanup, not a game callback. Cancel held channel notes and
   // drain synth tails before another score is allowed to acquire this device.
   device.write(Array.from({length:16},(_,channel)=>[[0x330,0xb0|channel],[0x330,123],[0x330,0]]).flat());
   await settleMt32Startup(device,()=>false,profile.yieldTask);
  })();}};
 }catch(error){owner.close();throw error;}
}
