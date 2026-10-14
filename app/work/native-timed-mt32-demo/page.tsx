'use client';
import {useEffect,useRef,useState} from 'react';
import {loadBrowserNativeDemoData,runBrowserNativeDemo} from '@/lib/game/browser-native-demo';
import {loadBrowserMt32Output} from '@/lib/game/browser-mt32-output';
import type {OriginalMt32MpuProgram} from '@/lib/game/mt32-transport';
import {versionedDemoResource} from '@/lib/game/versioned-demo-resource';
import {PC_PIT_INPUT_HZ} from '@/lib/game/timer-interrupt';
import type {Assets} from '@/lib/game/types';
// Resource-state reconstruction only, matching allocated test fixtures. No
// physical MIDI is sent here. The owning adapter then performs real timed init.
function reconstructDriver(program:OriginalMt32MpuProgram){const writes:number[][]=[];let step=program.next();while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}return {result:step.value,writes};}
export default function TimedDemoCheck(){
 const canvas=useRef<HTMLCanvasElement>(null),owner=useRef<AbortController|undefined>(undefined),mounted=useRef(true);
 const [status,setStatus]=useState('Ready · local test only'),[busy,setBusy]=useState(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;owner.current?.abort();};},[]);
 const start=async()=>{
  if(owner.current||!canvas.current)return;
  if(!['localhost','127.0.0.1','[::1]'].includes(window.location.hostname)){setStatus('Localhost required');return;}
  const abort=new AbortController();owner.current=abort;setBusy(true);setStatus('Loading original demo and Roland device…');
  const context=new AudioContext();let device:Awaited<ReturnType<typeof loadBrowserMt32Output>>|undefined;
  const report=(value:string)=>{if(mounted.current&&owner.current===abort)setStatus(value);};
  const read=async(path:string)=>{const result=await fetch(path,{signal:abort.signal});if(!result.ok)throw Error('Could not load '+path);return result;};
  try{
   await context.resume();
   const generation=new URLSearchParams(window.location.search).get('play-engine')==='ms-1990'?'ms-1990':'ms-1991';
   const assets=await (await read('/game/assets.json')).json() as Assets;
   const data=await loadBrowserNativeDemoData(assets);
   if(abort.signal.aborted)throw new DOMException('Demo stopped','AbortError');
   device=await loadBrowserMt32Output(abort.signal);
   const patch=new Uint8Array(await (await read('/game/original-resources/MT32.PLB')).arrayBuffer());
   const replay=versionedDemoResource(generation)?.bytes??await data.catalog.read('DEFAULT.RPL');
   if(!replay)throw Error('Original demo replay missing');
   report('Running '+generation+' timed demo · click Stop or press a game key');
   await runBrowserNativeDemo({canvas:canvas.current!,context,data:{...data,physicsEngine:generation,soundDevice:{kind:'mt32',driverGeneration:generation,execute:reconstructDriver}},menu:{configuration:Array.from(replay.subarray(0,24)),track:Array.from(replay.subarray(24,0x722)),name:'DEFAULT',camera:0,graphics:2,soundEnabled:true},signal:abort.signal,
    timedMt32:{device,generation,patch,profile:{cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},cancelled:()=>abort.signal.aborted,yieldTask:()=>new Promise(resolve=>setTimeout(resolve,0))},async stopMusic(){}},
    onFrame(frame,length){if(frame%100===0)report(`${generation} · replay frame ${frame}/${length}`);},
   });
   report('Complete · menu restored and audio released');
  }catch(error){report(error instanceof DOMException&&error.name==='AbortError'?'Stopped · audio released':String(error));}
  finally{device?.close();await context.close();if(owner.current===abort){owner.current=undefined;if(mounted.current)setBusy(false);}}
 };
 return <main className="game-shell"><h1>Timed Roland demo check</h1><p>Local-only original replay and real synthesizer. Virtual resource setup followed by timed device initialization. Nominal CPU profile; not verified original hardware timing. No saved files or release defaults are changed.</p><button disabled={busy} onClick={()=>void start()}>Start demo</button><button disabled={!busy} onClick={()=>owner.current?.abort()}>Stop</button><p role="status">{status}</p><canvas ref={canvas} width={640} height={400} tabIndex={0} style={{maxWidth:'100%',height:'auto'}}/><p><a href="/work/native-timed-mt32-session">Music session check</a></p></main>;
}
