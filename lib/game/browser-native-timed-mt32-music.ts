import type {BrowserMt32Power} from './browser-native-mt32-music.ts';
import type {OriginalMt32MusicSeed} from './mt32-music-runtime.ts';
import {nativeMusicScores} from './native-music-score.ts';
import {createTimedMt32SongFactory} from './timed-mt32-song-factory.ts';
import {createNativeTimedMt32Music} from './native-timed-mt32-music.ts';
type Profile=Parameters<typeof createTimedMt32SongFactory>[4];
/** Explicit browser connection; does not select itself or close caller power.
 * Per-song reinitialization remains diagnostic until race handoff is verified. */
export async function createBrowserNativeTimedMt32Music(context:AudioContext,signal:AbortSignal,power:BrowserMt32Power,generation:'ms-1990'|'ms-1991',profile:Profile,onHardwareTick?:(dispatch:boolean)=>void){
 const check=()=>{if(signal.aborted)throw new DOMException('Roland music closed','AbortError');};
 check();if(!power.device&&!await power.powerOn())throw new DOMException('Roland device unavailable','AbortError');
 check();const device=power.device;if(!device)throw Error('Roland device missing');
 const read=async(path:string)=>{const response=await fetch('/game/'+path,{signal});if(!response.ok)throw Error('Original Roland resource failed to load: '+path);return response;};
 const [entries,patch]=await Promise.all([
  Promise.all(nativeMusicScores.map(async name=>[name,await (await read(`mt32-music-${name}-seed.json`)).json() as OriginalMt32MusicSeed] as const)),
  read('original-resources/MT32.PLB').then(async response=>new Uint8Array(await response.arrayBuffer())),
 ]);
 check();if(power.device!==device)throw new DOMException('Roland device changed during loading','AbortError');
 // Panel power changes remove the physical synthesizer, not the game's MPU
 // clock. Only notified changes are accepted; an unexpected replacement still
 // invalidates this connection. MIDI sent while off is deliberately discarded.
 let expectedDevice:BrowserMt32Power['device']=power.device;
 const unsubscribe=power.subscribe?.(next=>{expectedDevice=next;});
 const deviceChanged=()=>power.device!==expectedDevice;
 const playbackDevice={...power.output,active:()=>power.device?.active()??false};
 const factory=createTimedMt32SongFactory(playbackDevice,Object.fromEntries(entries) as Parameters<typeof createTimedMt32SongFactory>[1],patch,generation,profile,onHardwareTick);
 const music=createNativeTimedMt32Music(context,(name,cancelled)=>factory(name,()=>signal.aborted||deviceChanged()||cancelled()));
 const abort=()=>{unsubscribe?.();music.close();};signal.addEventListener('abort',abort,{once:true});
 // Abort could arrive immediately after resource checks; do not return a live
 // controller in that case. Device ownership remains with the caller.
 if(signal.aborted){unsubscribe?.();music.close();signal.removeEventListener('abort',abort);check();}
 return {device,playbackDevice,deviceChanged,power,output:power.output,music:{...music,
  get settings(){return music.settings;},get hasScore(){return music.hasScore;},get failure(){return music.failure;},get playbackStartAt(){return music.playbackStartAt;},get deliveryDiagnostics(){return music.deliveryDiagnostics;},
  close(){signal.removeEventListener('abort',abort);unsubscribe?.();music.close();},
  async closeAsync(){signal.removeEventListener('abort',abort);try{await music.closeAsync();}finally{unsubscribe?.();}},
 }};
}
