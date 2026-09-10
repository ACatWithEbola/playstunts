import {createAudioRuntimeStream,type PlayerAudioChip} from './player-audio-stream.ts';
import type {createRaceAudio} from './race-audio.ts';
import type {createQueuedRaceAudio} from './queued-race-audio.ts';
/** Shared sample clock and chip for both cars. Caller supplies startup writes
 * from the original-order engine starts and the driver's saved mute volumes.
 */
export function createRaceAudioStream(race:ReturnType<typeof createRaceAudio>,queued:ReturnType<typeof createQueuedRaceAudio>,initialWrites:number[][],beforeSavedVolumes:Uint8Array,chip:PlayerAudioChip,sampleRate:number){
 let savedVolumes=beforeSavedVolumes.slice();
 const write=(writes:number[][])=>{for(const [register,value] of writes)chip.write(register,value);};
 const stream=createAudioRuntimeStream({initialWrites,tick:queued.tick},chip,sampleRate);
 return {
  ...stream,
  enqueue(...args:Parameters<typeof queued.enqueue>){write(queued.enqueue(...args));},
  setEnabled(enabled:boolean){const next=race.setEnabled(enabled,savedVolumes);savedVolumes=next.savedVolumes;write(next.writes);},
  crash(handle:number){write(race.crash(handle));},
  exit(){write(queued.exit());},
 };
}
