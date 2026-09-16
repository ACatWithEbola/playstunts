import {createMt32WasmOutput,type Mt32Wasm} from './mt32-wasm-output.ts';
let loading:Promise<void>|undefined;
const bridgeVersion='20260910-queue-recovery';
/** Load the local synthesizer independently of score or race ownership. */
export async function loadBrowserMt32Output(signal?:AbortSignal){
 const host=window as Window & {stuntsCreateMunt?:()=>Promise<Mt32Wasm>;stuntsMuntVersion?:string};
 const aborted=()=>{if(signal?.aborted)throw new DOMException('Roland audio closed','AbortError');};
 aborted();
 if(!host.stuntsCreateMunt||host.stuntsMuntVersion!==bridgeVersion){
  loading??=new Promise<void>((resolve,reject)=>{const script=document.createElement('script');script.type='module';script.src='/game/mt32-local/bootstrap.mjs?v='+bridgeVersion;script.onload=()=>resolve();script.onerror=()=>{script.remove();loading=undefined;reject(Error('Roland synthesizer failed to load'));};document.head.appendChild(script);});
  await loading;
 }
 aborted();if(!host.stuntsCreateMunt||host.stuntsMuntVersion!==bridgeVersion)throw Error('Roland synthesizer is unavailable');
 const roms=await Promise.all(['ctrl_mt32_1_07.rom','pcm_mt32.rom'].map(async name=>{const response=await fetch('/game/mt32-local/'+name,{signal});if(!response.ok)throw Error('Roland ROM failed to load: '+name);return new Uint8Array(await response.arrayBuffer());}));
 aborted();const munt=await host.stuntsCreateMunt();
 try{aborted();return createMt32WasmOutput(munt,roms[0],roms[1]);}catch(error){munt._stunts_mt32_close();throw error;}
}
