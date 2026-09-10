'use client';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {playBrowserSetupBell} from '@/lib/game/browser-setup-bell';
import {runBrowserNativeSetup} from '@/lib/game/browser-native-setup';

/** Public settings surface; the original installer remains in its work route. */
export default function NativeSetupPanel({onClosed}:{onClosed?:()=>void|Promise<void>}){
 const canvas=useRef<HTMLCanvasElement>(null),active=useRef<AbortController|null>(null),mounted=useRef(true);
 const [previewMissing,setPreviewMissing]=useState(false);
 const [running,setRunning]=useState(false),[status,setStatus]=useState('Display and sound settings'),[error,setError]=useState('');
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;active.current?.abort();};},[]);
 const start=async()=>{
  if(active.current)return;
  const controller=new AbortController();active.current=controller;setRunning(true);setError('');setStatus('Loading Setup…');
  let audio:AudioContext|undefined;
  try{
   audio=new AudioContext();await audio.resume();
   await runBrowserNativeSetup(canvas.current!,controller.signal,{browserSettings:true,ready(){if(mounted.current)setStatus('Exit saves · Escape cancels');},bell:()=>playBrowserSetupBell(audio!,controller.signal)});
   if(!controller.signal.aborted&&mounted.current){setStatus('Setup closed');await onClosed?.();}
  }catch(reason){if(mounted.current){setStatus(controller.signal.aborted?'Setup closed':'Setup could not finish');if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:String(reason));}}
  finally{await audio?.close().catch(()=>{});if(active.current===controller)active.current=null;if(mounted.current)setRunning(false);}
 };
 return <section className="native-setup-panel" data-running={running?"true":"false"} aria-label="Stunts Setup">
  <div className="game-toolbar"><span role="status">{status}</span><button disabled={running} onClick={()=>void start()}>Open Setup</button></div>
  <div className="launcher-screen" style={{display:!running&&previewMissing?"none":undefined}}>
   <canvas ref={canvas} width={720} height={400} tabIndex={0} aria-label="Stunts Setup display and sound menu" style={{width:'100%',height:'100%',aspectRatio:'4 / 3',background:'black',imageRendering:'pixelated'}}/>
   {!running&&<Image onError={()=>setPreviewMissing(true)} className="setup-menu-preview" src="/site/setup-menu.png" alt="Stunts Setup menu: display, sound and exit" fill unoptimized style={{objectFit:"fill",objectPosition:"center"}}/>}
  </div>
  <p className="launcher-screen-help">Arrow keys and Enter select. Exit saves; Escape leaves without saving.</p>
  {error&&<p role="alert" className="error">{error}</p>}
 </section>;
}
