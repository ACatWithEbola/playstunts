import {createSwitchableMt32Output} from './switchable-mt32-output.ts';
import {loadBrowserMt32Output} from './browser-mt32-output.ts';
import {createNativeMt32Music} from './native-mt32-music.ts';
import type {OriginalMt32MusicSeed} from './mt32-music-runtime.ts';
import {initializeOriginalMt32,uploadOriginalMt32Patches} from './mt32-system-exclusive.ts';
import {executeCooperativeReadyMt32Program} from './cooperative-ready-mt32-program.ts';
import {settleMt32Startup} from './mt32-startup-settle.ts';
export const createBrowserMt32Power=()=>createSwitchableMt32Output(32000,loadBrowserMt32Output);
export type BrowserMt32Power=ReturnType<typeof createBrowserMt32Power>;
export type BrowserNativeMt32Device=Awaited<ReturnType<typeof loadBrowserMt32Output>>;
/** One retained device for the internal opening/menu/race integration check.
 * Original PC upload-loop pacing remains outside this ready-MPU adapter. */
export async function createBrowserNativeMt32Music(context:AudioContext,signal:AbortSignal,externalPower?:BrowserMt32Power){
 const power=externalPower??createBrowserMt32Power(),output=power.output;
 const release=()=>{if(!externalPower)power.close();};
 const abort=()=>release();signal.addEventListener('abort',abort,{once:true});
 try{
  if(signal.aborted)throw new DOMException('Roland startup cancelled','AbortError');
  if(!power.device&&!await power.powerOn())throw new DOMException('Roland startup cancelled','AbortError');
  const read=async(path:string)=>{const response=await fetch('/game/'+path,{signal});if(!response.ok)throw Error('Original Roland resource failed to load: '+path);return response;};
  const [titl,slct,vict,over,patch]=await Promise.all([
   read('mt32-music-titl-seed.json').then(r=>r.json() as Promise<OriginalMt32MusicSeed>),
   read('mt32-music-slct-seed.json').then(r=>r.json() as Promise<OriginalMt32MusicSeed>),
   read('mt32-music-vict-seed.json').then(r=>r.json() as Promise<OriginalMt32MusicSeed>),
   read('mt32-music-over-seed.json').then(r=>r.json() as Promise<OriginalMt32MusicSeed>),
   read('original-resources/MT32.PLB').then(async r=>new Uint8Array(await r.arrayBuffer())),
  ]);
  if(signal.aborted)throw new DOMException('Roland startup cancelled','AbortError');
  const driver=Uint8Array.from(titl.driver);
  const startupHost={write:(writes:number[][])=>output.write(writes),cancelled:()=>signal.aborted};
  await executeCooperativeReadyMt32Program(initializeOriginalMt32(driver),startupHost);
  await executeCooperativeReadyMt32Program(uploadOriginalMt32Patches(driver,(_,at)=>patch[at],0,0),startupHost);
  const initializedDevice=power.device;
  if(initializedDevice)await settleMt32Startup({sampleRate:output.sampleRate,active:()=>power.device===initializedDevice&&initializedDevice.active(),render:frames=>output.render(frames)},()=>signal.aborted);
  return {output:{...output,close(){signal.removeEventListener('abort',abort);release();}},power,music:createNativeMt32Music(context,output,{titl,slct,vict,over})};
 }catch(error){signal.removeEventListener('abort',abort);release();throw error;}
}
