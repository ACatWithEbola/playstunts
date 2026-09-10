import {advanceOriginalHardwareClock} from './hardware-clock-memory.ts';
import type {createNativeRaceSession} from './native-race-session.ts';
import type {createAllocatedRaceAudio} from './allocated-race-audio.ts';
import type {NativeRaceInputHost} from './race-input-selection.ts';
import {readOriginalRaceAudioTargets} from './consume-race-audio.ts';
import {dispatchRaceFrameSounds} from './race-frame-sounds.ts';
export type AllocatedRaceDevices=Pick<NativeRaceInputHost,'mouse'|'joystickSteering'|'controls'|'keyDown'>;
/** One native hardware tick, then the original race timer and frame catch-up.
 * Input-triggered crashes execute before that same captured frame advances. */
export function advanceAllocatedRace(session:ReturnType<typeof createNativeRaceSession>,audio:ReturnType<typeof createAllocatedRaceAudio>,devices:AllocatedRaceDevices,caller:{entryStackPointer:number;incomingSI:number},stackMatches:()=>boolean=()=>true){
 const d=0x2d1a0;if(!advanceOriginalHardwareClock(session.state.memory,d))return [] as number[][];
 const writes=audio.tick(stackMatches());
 session.timerTick({...devices,stackMatches,
  audioSample(record,interval){for(const target of readOriginalRaceAudioTargets(session.state.memory,d,record,interval))audio.update(target.handle,target.rpm,target.previous,target.current,target.interval);},
  pauseAudio(){writes.push(...audio.produce());},
  crash(cause,car){for(const effect of session.crash(cause,car))if(effect.type==='audio')writes.push(...audio.crash(effect.handle));},
 });
 session.advanceCaptured(caller,result=>{writes.push(...dispatchRaceFrameSounds(result,audio));});
 return writes;
}
