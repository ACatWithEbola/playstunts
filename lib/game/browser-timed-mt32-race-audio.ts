import {createBrowserTimedMt32Audio} from './browser-timed-mt32-audio.ts';
import type {createTimedMt32RaceStream} from './timed-mt32-race-stream.ts';
import type {BrowserNativeRaceAudio} from './browser-allocated-race-loop.ts';
/** Asynchronous browser delivery for an explicitly initialized timed race.
 * Implements the awaited race interface: host must await
 * pump/write before replacing memory. Physical device ownership stays external. */
export function createBrowserTimedMt32RaceAudio(context:AudioContext,stream:ReturnType<typeof createTimedMt32RaceStream>,active:()=>boolean,onScheduled?:Parameters<typeof createBrowserTimedMt32Audio>[3]){
 let closed=false;
 const audio=createBrowserTimedMt32Audio(context,stream,()=>!closed&&active(),onScheduled);
 const write=async(writes:number[][])=>{if(closed)throw new DOMException('Timed race audio closed','AbortError');await stream.writeAsync(writes);};
 const result={
  pump:()=>audio.pump(),
  write,writeAsync:write,
  suspend:()=>audio.suspend(),resume:()=>audio.resume(),setVolume:audio.setVolume,
  async suspendAsync(){audio.suspend();await stream.drain();},
  close(){if(closed)return;closed=true;audio.close();stream.close();},
  async closeAsync(){closed=true;audio.close();await stream.closeAsync();},
 };
 return result satisfies BrowserNativeRaceAudio;
}
