'use client';
import {useEffect,useRef,useState} from 'react';
import {runBrowserNativeOpening} from '@/lib/game/browser-native-opening';
import {runBrowserNativeCredits} from '@/lib/game/browser-native-credits';
import {runBrowserNativeIntro} from '@/lib/game/browser-native-intro';
import {runBrowserNativeTitleCards} from '@/lib/game/browser-native-title-cards';
import {loadBrowserNativeDemoData,runBrowserNativeDemo} from '@/lib/game/browser-native-demo';
import type {NativeBrowserDisplayMode} from '@/lib/game/browser-native-display-race';
import {runBrowserNativeManualRace} from '@/lib/game/browser-native-manual-race';
import {createBrowserNativeMenus} from '@/lib/game/browser-native-menus';
import {createNativeMusic} from '@/lib/game/native-music';
import type {Assets} from '@/lib/game/types';

export default function NativeDisplayCheck(){
 const canvas=useRef<HTMLCanvasElement>(null),active=useRef<AbortController|null>(null),audio=useRef<AudioContext|null>(null);
 const selectedSettings=useRef({mouse:false,joystick:false,graphics:2});
 const selectedTrack=useRef<{name:string;path:string;raw:number[]}|null>(null);
 const selectedConfiguration=useRef([67,79,85,78,0,1,0,255,0,0,0,0,0,68,69,70,65,85,76,84,0,0,1,0]);
 const [previousRun,setPreviousRun]=useState('');
 const report=(message:string)=>{setStatus(message);try{sessionStorage.setItem('stunts-display-check-status',JSON.stringify({message,at:new Date().toISOString()}));}catch{/* Storage may be unavailable in private browsing. */}};
 const [mode,setMode]=useState<NativeBrowserDisplayMode>('ega'),[status,setStatus]=useState('Choose a display mode and start the original demo.'),[running,setRunning]=useState(false);
 useEffect(()=>{
  try{const saved=JSON.parse(sessionStorage.getItem('stunts-display-check-status')??'null');if(saved?.message)setPreviousRun(`Previous session: ${saved.message} (${saved.at})`);}catch{}
  const failed=(event:ErrorEvent)=>{if(active.current)report(`Game error: ${event.message}`);};
  const rejected=(event:PromiseRejectionEvent)=>{if(active.current)report(`Game error: ${String(event.reason)}`);};
  window.addEventListener('error',failed);window.addEventListener('unhandledrejection',rejected);
  return ()=>{if(active.current)report('Session interrupted by page cleanup or a development update.');active.current?.abort('page-cleanup');void audio.current?.close();window.removeEventListener('error',failed);window.removeEventListener('unhandledrejection',rejected);};
 },[]);
 const start=async(kind:'demo'|'race'|'car'|'opponent'|'track'|'options'|'menu'|'titles'|'intro'|'credits'|'opening'='demo')=>{
  if(active.current)return;
  const controller=new AbortController();active.current=controller;setRunning(true);report('Loading original resources…');
  const context=new AudioContext();audio.current=context;
  try{
   await context.resume();
   const response=await fetch('/game/assets.json',{signal:controller.signal});if(!response.ok)throw Error('Original assets could not load');const assets=await response.json() as Assets;
   const data=await loadBrowserNativeDemoData(assets),track=assets.tracks.find(track=>track.name==='DEFAULT');if(!track)throw Error('Original DEFAULT track is missing');
   const menu={configuration:[...selectedConfiguration.current],track:selectedTrack.current?.raw??track.raw,name:selectedTrack.current?.name??'DEFAULT',path:selectedTrack.current?.path??'',camera:0,...selectedSettings.current,soundEnabled:true};
   if(kind==='credits'){const music=await createNativeMusic(context);try{music.play('titl');report(`${mode.toUpperCase()} original credits`);await runBrowserNativeCredits(canvas.current!,mode,controller.signal);}finally{music.close();}}else if(kind==='intro'){const music=await createNativeMusic(context);try{music.play('titl');report(`${mode.toUpperCase()} original animated logo`);await runBrowserNativeIntro(canvas.current!,mode,controller.signal,data,assets,Array.from(data.base.subarray(0x2d1a0+0x9f5c,0x2d1a0+0x9f62)));}finally{music.close();}}else if(kind==='titles'){const music=await createNativeMusic(context);try{music.play('titl');report(`${mode.toUpperCase()} original title cards`);await runBrowserNativeTitleCards(canvas.current!,mode,controller.signal);}finally{music.close();}}else if(kind==='demo')await runBrowserNativeDemo({canvas:canvas.current!,context,data,displayMode:mode,signal:controller.signal,menu,onFrame(frame,length){report(`${mode.toUpperCase()} demo · frame ${frame} / ${length}`);}});
   else{
    const music=await createNativeMusic(context);let menus:Awaited<ReturnType<typeof createBrowserNativeMenus>>|undefined;
    try{menus=await createBrowserNativeMenus({canvas:canvas.current!,assets,music,settings:selectedSettings.current,displayMode:mode,signal:controller.signal,configuration:menu.configuration,track:{raw:[...menu.track],name:menu.name,path:menu.path}});if(kind==='menu'||kind==='opening'){
     let randomState=Array.from(data.base.subarray(0x2d1a0+0x9f5c,0x2d1a0+0x9f62));
     const opening=async()=>{menus!.setInputActive(false);music.play('titl');try{randomState=(await runBrowserNativeOpening(canvas.current!,mode,controller.signal,data,assets,randomState,stage=>report(`${mode.toUpperCase()} original ${stage}`))).randomState;}finally{menus!.setInputActive(true);}};
     if(kind==='opening')await opening();
     for(;;){menus.setInputActive(true);music.play('slct');report(`${mode.toUpperCase()} main menu`);const transition=await menus.run();selectedConfiguration.current=[...menus.configuration];selectedSettings.current={...menus.settings};selectedTrack.current={...menus.track,raw:[...menus.track.raw]};
      if(!('configuration' in transition)){if(transition.type==='intro'&&kind==='opening'){await opening();continue;}break;}
      await menus.fadeMusic();
      const current={...menu,configuration:transition.configuration,track:menus.track.raw,name:menus.track.name,path:menus.track.path,...menus.settings,soundEnabled:music.settings.soundEnabled};
      if(transition.type==='demo'){menus.setInputActive(false);try{await runBrowserNativeDemo({canvas:canvas.current!,context,data,displayMode:mode,signal:controller.signal,menu:current,onFrame(frame,length){report(`${mode.toUpperCase()} demo · frame ${frame} / ${length}`);}});}finally{menus.setInputActive(true);}}
      else {const replay=transition.type==='replay'?menus.selectedReplay:undefined;if(transition.type==='replay'&&!replay)throw Error('Original replay selection is missing');await runBrowserNativeManualRace({context,data,menus,menu:current,displayMode:mode,replay,signal:controller.signal,stopMusic:music.stop,onStage(stage){report(`${mode.toUpperCase()} race · ${stage}`);}});}
     }
    }else if(kind==='car'||kind==='opponent'||kind==='track'||kind==='options'){report(`${mode.toUpperCase()} ${kind} selection`);if(kind==='car')await menus.selectCar(menu.configuration,0);else if(kind==='opponent')await menus.selectOpponent(menu.configuration);else if(kind==='options'){const result=await menus.selectOptions();selectedSettings.current={...menus.settings};if(result==='replay'){if(!menus.selectedReplay)throw Error('Original replay selection is missing');await runBrowserNativeManualRace({context,data,menus,menu:{...menu,configuration:menus.configuration,...menus.settings,track:menus.track.raw,name:menus.track.name,path:menus.track.path},displayMode:mode,replay:menus.selectedReplay,signal:controller.signal,stopMusic:music.stop,onStage(stage){report(`${mode.toUpperCase()} replay · ${stage}`);}});}}else {await menus.selectTrack();selectedTrack.current={...menus.track,raw:[...menus.track.raw]};}selectedConfiguration.current=[...menu.configuration];}else await runBrowserNativeManualRace({context,data,menus,menu,displayMode:mode,signal:controller.signal,stopMusic:music.stop,onStage(stage){report(`${mode.toUpperCase()} race · ${stage}`);}});}
    finally{menus?.close();music.close();}
   }
   report(kind==='demo'?'Demo finished.':kind==='car'||kind==='opponent'||kind==='track'||kind==='options'||kind==='menu'||kind==='titles'||kind==='intro'||kind==='credits'||kind==='opening'?'Selection finished.':'Race finished.');
  }catch(error){if(!controller.signal.aborted)console.error('Native display check failed',error);report(controller.signal.reason==='page-cleanup'?'Session interrupted by page cleanup or a development update.':controller.signal.aborted?(kind==='demo'?'Demo stopped.':kind==='car'||kind==='opponent'||kind==='track'||kind==='options'||kind==='menu'||kind==='titles'||kind==='intro'||kind==='credits'||kind==='opening'?'Selection stopped.':'Race stopped.'):String(error));}
  finally{if(context.state!=='closed')await context.close();if(audio.current===context)audio.current=null;active.current=null;setRunning(false);}
 };
 return <main style={{padding:24,color:'#eee',background:'#111',minHeight:'100vh'}}><h1>Original display mode check</h1><p>Internal native display check. Menus, editor and driving use the selected mode. Play from intro checks the complete opening-to-menu sequence.</p><select aria-label="Display mode" value={mode} disabled={running} onChange={event=>setMode(event.target.value as NativeBrowserDisplayMode)}>{(['cga','tandy','ega'] as const).map(value=><option key={value} value={value}>{value.toUpperCase()}</option>)}</select>{' '}<button disabled={running} onClick={()=>void start('demo')}>Start demo</button>{' '}<button disabled={running} onClick={()=>void start('opening')}>Play from intro</button>{' '}<button disabled={running} onClick={()=>void start('titles')}>Title cards</button>{' '}<button disabled={running} onClick={()=>void start('intro')}>Animated logo</button>{' '}<button disabled={running} onClick={()=>void start('credits')}>Credits</button>{' '}<button disabled={running} onClick={()=>void start('menu')}>Main menu</button>{' '}<button disabled={running} onClick={()=>void start('race')}>Start race</button>{' '}<button disabled={running} onClick={()=>void start('car')}>Choose car</button>{' '}<button disabled={running} onClick={()=>void start('opponent')}>Choose opponent</button>{' '}<button disabled={running} onClick={()=>void start('track')}>Choose track</button>{' '}<button disabled={running} onClick={()=>void start('options')}>Options</button>{' '}<button disabled={!running} onClick={()=>active.current?.abort()}>Stop</button><p role="status">{status}</p>{previousRun&&<p>{previousRun}</p>}<canvas ref={canvas} width={960} height={720} tabIndex={0} style={{width:'min(100%, 960px)',aspectRatio:'4 / 3',background:'black',imageRendering:'pixelated'}}/></main>;
}
