import {advanceOriginalHardwareClock} from './hardware-clock-memory.ts';
import type {createNativeRaceSession} from './native-race-session.ts';
import type {createAllocatedRaceAudio} from './allocated-race-audio.ts';
import type {NativeRaceInputHost} from './race-input-selection.ts';
import {readOriginalRaceAudioTargets} from './consume-race-audio.ts';
import {dispatchRaceFrameSounds} from './race-frame-sounds.ts';
import type {createAllocatedTandyRaceAudio} from './allocated-tandy-race-audio.ts';
export type AllocatedRaceDevices=Pick<NativeRaceInputHost,'mouse'|'joystickSteering'|'controls'|'keyDown'>;
const waitingSessions=new WeakSet<object>();
export function assertAllocatedRaceAudioIdle(session:ReturnType<typeof createNativeRaceSession>){
 if(waitingSessions.has(session))throw Error('Race operation overlaps pending audio continuation');
}
/** One native hardware tick, then the original race timer and frame catch-up.
 * Input-triggered crashes execute before that same captured frame advances. */
export function advanceAllocatedRace(session:ReturnType<typeof createNativeRaceSession>,audio:ReturnType<typeof createAllocatedRaceAudio>,devices:AllocatedRaceDevices,caller:{entryStackPointer:number;incomingSI:number},stackMatches:()=>boolean=()=>true){
 if(waitingSessions.has(session))throw Error('Race tick overlaps pending audio continuation');
 const d=0x2d1a0;if(!advanceOriginalHardwareClock(session.state.memory,d))return [] as number[][];
 const writes=audio.tick(stackMatches());
 return finishAllocatedRaceTick(session,audio,devices,caller,stackMatches,writes);
}
/** CPU continuation entry: the owner completes audio/IRQ work before race
 * timers, input or captured physics advance. Caller must serialize ticks and
 * retain resources across the await; rejection does not run the trailing work. */
export async function advanceAllocatedRaceWithAudioWait(session:ReturnType<typeof createNativeRaceSession>,audio:ReturnType<typeof createAllocatedRaceAudio>,devices:AllocatedRaceDevices,caller:{entryStackPointer:number;incomingSI:number},audioTick:()=>Promise<number[][]>,stackMatches:()=>boolean=()=>true){
 if(waitingSessions.has(session))throw Error('Race tick overlaps pending audio continuation');
 waitingSessions.add(session);
 const ownedMemory=session.state.memory;
 try{
  if(!advanceOriginalHardwareClock(ownedMemory,0x2d1a0))return [] as number[][];
  const writes=await audioTick();
  if(session.state.memory!==ownedMemory)throw Error('Race memory replaced during audio continuation');
  return finishAllocatedRaceTick(session,audio,devices,caller,stackMatches,writes);
 }finally{waitingSessions.delete(session);}
}
export function* advanceAllocatedRaceProgram(session:ReturnType<typeof createNativeRaceSession>,audio:ReturnType<typeof createAllocatedRaceAudio>,devices:AllocatedRaceDevices,caller:{entryStackPointer:number;incomingSI:number},audioProgram:()=>ReturnType<ReturnType<typeof createAllocatedTandyRaceAudio>['tickProgram']>,stackMatches:()=>boolean=()=>true){
 assertAllocatedRaceAudioIdle(session);waitingSessions.add(session);
 const ownedMemory=session.state.memory;
 const priorGuard=ownedMemory[0x2d1a0+0x408e];let guarded=false;
 const releaseGuard=()=>{if(guarded){ownedMemory[0x2d1a0+0x408e]=priorGuard;new DataView(ownedMemory.buffer,ownedMemory.byteOffset,ownedMemory.byteLength).setUint16(0x2d1a0+0x408c,0,true);guarded=false;}};
 try{
  if(!advanceOriginalHardwareClock(ownedMemory,0x2d1a0))return {writes:[] as number[][],bios:[]};
  if(priorGuard)throw Error('Race callback entered under original IRQ reentry guard');
  ownedMemory[0x2d1a0+0x408e]=1;guarded=true;
  const sound=yield* audioProgram();
  if(session.state.memory!==ownedMemory)throw Error('Race memory replaced during audio continuation');
  return {writes:finishAllocatedRaceTick(session,audio,devices,caller,stackMatches,sound.writes,releaseGuard),bios:sound.bios};
 }finally{releaseGuard();waitingSessions.delete(session);}
}
function finishAllocatedRaceTick(session:ReturnType<typeof createNativeRaceSession>,audio:ReturnType<typeof createAllocatedRaceAudio>,devices:AllocatedRaceDevices,caller:{entryStackPointer:number;incomingSI:number},stackMatches:()=>boolean,writes:number[][],beforeCaptured?:()=>void){
 const d=0x2d1a0;
 session.timerTick({...devices,stackMatches,
  audioSample(record,interval){for(const target of readOriginalRaceAudioTargets(session.state.memory,d,record,interval))audio.update(target.handle,target.rpm,target.previous,target.current,target.interval);},
  pauseAudio(){writes.push(...audio.produce());},
  crash(cause,car){for(const effect of session.crash(cause,car))if(effect.type==='audio')writes.push(...audio.crash(effect.handle));},
 });
 beforeCaptured?.();session.advanceCaptured(caller,result=>{writes.push(...dispatchRaceFrameSounds(result,audio));});
 return writes;
}
