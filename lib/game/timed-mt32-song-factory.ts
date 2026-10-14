import type {NativeMusicScore} from './native-music-score.ts';
import type {OriginalMt32MusicSeed} from './mt32-music-runtime.ts';
import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
import {versionedMt32MusicSeed} from './versioned-mt32-music-seed.ts';
import {createOwnedTimedMt32Device} from './owned-timed-mt32-device.ts';
import {initializeTimedMt32Device} from './timed-mt32-startup.ts';
import {createTimedMt32ScoreStream} from './timed-mt32-score-stream.ts';
import {settleMt32Startup} from './mt32-startup-settle.ts';
type Profile=Omit<Parameters<typeof createOwnedTimedMt32Device>[1],'cancelled'>;
/** Explicit diagnostic factory. Reinitializes the selected driver per song;
 * callers must serialize songs and must not concurrently give device to a race.
 * Device lifetime remains external. This is not yet the main-game handoff. */
export function createTimedMt32SongFactory(device:Mt32StereoOutput&{active():boolean},seeds:Record<NativeMusicScore,OriginalMt32MusicSeed>,patch:Uint8Array,generation:'ms-1990'|'ms-1991',profile:Profile,onHardwareTick?:(dispatch:boolean)=>void){
 const retainedSeeds=structuredClone(seeds),retainedPatch=Uint8Array.from(patch);
 const retainedProfile={...profile};
 let occupied=false,failed:unknown;
 return async(name:NativeMusicScore,cancelled:()=>boolean)=>{
  if(failed)throw failed;
  if(occupied)throw Error('Roland device already has a song owner');
  if(cancelled())throw new DOMException('Roland song cancelled','AbortError');
  const seed=versionedMt32MusicSeed(retainedSeeds[name],generation);
  const owner=createOwnedTimedMt32Device(device,{...retainedProfile,cancelled});
  occupied=true;
  let released=false;
  const release=async()=>{
   if(released)return;released=true;owner.close();
   try{
    // Ownership cleanup, not a translated game instruction: stop every channel
    // and drain queued notes/reverb before the next song acquires the device.
    device.write(Array.from({length:16},(_,channel)=>[[0x330,0xb0|channel],[0x330,123],[0x330,0]]).flat());
    await settleMt32Startup(device,()=>false,retainedProfile.yieldTask);
   }catch(error){failed=error;throw error;}finally{occupied=false;}
  };
  try{
   await initializeTimedMt32Device(Uint8Array.from(seed.driver),retainedPatch,generation,owner);
   await settleMt32Startup({sampleRate:device.sampleRate,active:()=>device.active(),render:frames=>owner.output.render(frames)},cancelled,retainedProfile.yieldTask);
   const score=await createTimedMt32ScoreStream(seed,owner.output,owner.transport,onHardwareTick);
   owner.output.render(512);
   await settleMt32Startup({sampleRate:device.sampleRate,active:()=>device.active(),render:frames=>owner.output.render(frames)},cancelled,retainedProfile.yieldTask);
   if(cancelled()){score.close();throw new DOMException('Roland song cancelled','AbortError');}
   return {score,release};
  }catch(error){await release();throw error;}
 };
}
