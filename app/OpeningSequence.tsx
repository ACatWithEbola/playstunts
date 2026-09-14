'use client';
import {createUpgradedIntro} from '@/lib/game/upgraded-intro';
import introMaterials from '@/public/game/track-materials.json';
import {applyNativeStartupAudio} from '@/lib/game/native-launch-profile';
import {useEffect,useRef,useState,type KeyboardEvent as ReactKeyboardEvent} from 'react';
import {rasterOriginalDrawCall} from '@/lib/game/raster-original-draw-call';
import {createBrowserNativeMt32Music,type BrowserNativeMt32Device,type BrowserMt32Power} from '@/lib/game/browser-native-mt32-music';
import {createNativeTandyMusic} from '@/lib/game/native-tandy-music';
import {serviceSuppliedTandySilentRequests} from '@/lib/game/supplied-tandy-bios';
import {executeReadyMt32Program} from '@/lib/game/ready-mt32-program';
import {executeCooperativeReadyMt32Program} from '@/lib/game/cooperative-ready-mt32-program';
import {createNativeMusic} from '@/lib/game/native-music';
import {runBrowserNativeOpening} from '@/lib/game/browser-native-opening';
import {readRetainedMenuSession,type RetainedMenuSession} from '@/lib/game/retained-menu-session';
import {focusBrowserGameCanvas} from '@/lib/game/browser-game-focus';
import {advanceRetainedMenuClock} from '@/lib/game/retained-menu-clock';
import {createBrowserMenuInput} from '@/lib/game/browser-menu-input';
import {originalOpeningExitDecision,originalAnimatedOpeningSkip} from '@/lib/game/opening-exit-flow';
import {confirmBrowserOpeningExit,type BrowserOpeningDisplay} from '@/lib/game/browser-opening-exit';
import type {NativeBrowserDisplayMode} from '@/lib/game/browser-native-display-race';
import {createNativePcSpeakerMusic} from '@/lib/game/native-pc-speaker-music';
import {runBrowserNativeManualRace} from '@/lib/game/browser-native-manual-race';
import {createBrowserNativeMenus,type BrowserGraphicsSwitch} from '@/lib/game/browser-native-menus';
import {loadBrowserNativeDemoData,runBrowserNativeDemo,type BrowserNativeDemoData} from '@/lib/game/browser-native-demo';
import type {Assets} from '@/lib/game/types';
import {originalTitleCards} from '@/lib/game/title-cards';
import {originalSpritePresentation} from '@/lib/game/sprite-presentation';
import {originalInputWait} from '@/lib/game/input-repeat';
import {drawOriginalTitleRevealPass} from '@/lib/game/title-reveal';
import {originalIntroCredits} from '@/lib/game/intro-credits';
import {drawOriginalFont} from '@/lib/game/font-raster';
import {expandEditorArt} from '@/lib/game/editor-art-expand';
import {drawEditorClippedRaster} from '@/lib/game/editor-clipped-raster';
import {initializeOriginalCarSimulation} from '@/lib/game/initialize-car-simulation';
import {initializeOriginalIntroScene,originalIntroRoute} from '@/lib/game/initialize-intro-scene';
import {createOriginalIntroDriving,type IntroDrivingData} from '@/lib/game/intro-driving';
import {advanceOriginalIntroCamera,initialOriginalIntroCamera} from '@/lib/game/intro-camera';
import {createOriginalIntroRenderer} from '@/lib/game/intro-renderer';
import {createOriginalCanvasRaster} from '@/lib/game/original-canvas-raster';
import {trackOpponentRoutePoint} from '@/lib/physics/track-route-point';
import {PC_PIT_INPUT_HZ,ORIGINAL_PIT_DIVISOR} from '@/lib/game/timer-interrupt';
import type {Vector} from '@/lib/physics/math';
import {createFramePerformanceCounter,type FramePerformanceSnapshot} from '@/lib/game/frame-performance';
import {ENHANCED_CHASE_CAMERA_LABELS,nextEnhancedChaseCameraLevel,type EnhancedChaseCameraLevel} from '@/lib/game/enhanced-chase-camera';
function originalTrackValidationCode(reason:unknown){
 if(!(reason instanceof Error))return null;
 const match=/^Original (?:track route|terrain) error (\d+)$/.exec(reason.message);
 if(!match)return null;
 const code=Number(match[1]);return Number.isInteger(code)&&code>0&&code<15?code:null;
}
function trackValidationExplanation(code:number){
 if(code===7)return 'The finish line is present, but the road does not form a continuous route back to it. Connect the road into one complete loop, then try again.';
 return 'The track did not pass Stunts\' original validation. Open it in the Track Editor, correct the indicated track or terrain piece, and try again.';
}
/** Native opening, menus, demonstration and manual race integration. */
export default function OpeningSequence({assets,onBack,backLabel="← Back",soundDevice,displayMode,initiallyMuted=false,hercules=false,directory="C:\\",initialTrack,onRolandDevice,onRolandPower,rolandPower,onRunningChange,embedded=false,autoStart=false}:{autoStart?:boolean;embedded?:boolean;assets:Assets;onBack:()=>void;backLabel?:string;soundDevice?:'pc-speaker'|'mt32'|'tandy';initiallyMuted?:boolean;hercules?:boolean;displayMode?:NativeBrowserDisplayMode;directory?:string;initialTrack?:number[];onRunningChange?:(running:boolean)=>void;rolandPower?:BrowserMt32Power;onRolandDevice?:(device:BrowserNativeMt32Device|undefined)=>void;onRolandPower?:(power:Awaited<ReturnType<typeof createBrowserNativeMt32Music>>['power']|undefined)=>void}){
 const graphics=useRef<BrowserGraphicsSwitch>({enabled:false,chaseCamera:0}),[upgraded,setUpgraded]=useState(false),[graphicsNotice,setGraphicsNotice]=useState('');
 const performanceCounter=useRef(createFramePerformanceCounter()),performanceUiAt=useRef(0),performanceFrameAt=useRef(0),performanceRunning=useRef(false),performancePaused=useRef(false),performanceActiveRef=useRef(false),[performanceStats,setPerformanceStats]=useState<FramePerformanceSnapshot>(),[performanceVisible,setPerformanceVisible]=useState(true),[performanceActive,setPerformanceActive]=useState(false);
 graphics.current.notice=setGraphicsNotice;
 graphics.current.selectOriginalCamera=()=>{if((graphics.current.chaseCamera??0)===0)return;graphics.current.chaseCamera=0;setGraphicsNotice('Original Stunts camera');graphics.current.refresh?.();};
 graphics.current.performanceFrame=at=>{if(!performanceRunning.current||performancePaused.current)return;performanceFrameAt.current=at;if(!performanceActiveRef.current){performanceActiveRef.current=true;setPerformanceActive(true);}performanceCounter.current.frame(at);if(at-performanceUiAt.current<250)return;performanceUiAt.current=at;setPerformanceStats(performanceCounter.current.snapshot());};
 graphics.current.resetPerformance=()=>{performanceCounter.current.reset();performanceUiAt.current=0;performanceFrameAt.current=0;performanceActiveRef.current=false;setPerformanceActive(false);setPerformanceStats(undefined);};
 graphics.current.setPerformancePaused=paused=>{performancePaused.current=paused;if(!paused)return;performanceCounter.current.pause();performanceFrameAt.current=0;performanceActiveRef.current=false;setPerformanceActive(false);};
 const toggleGraphics=()=>{const enabled=!graphics.current.enabled;graphics.current.enabled=enabled;if(!enabled)graphics.current.chaseCamera=0;graphics.current.resetPerformance?.();setUpgraded(enabled);setGraphicsNotice(enabled?'Upgraded graphics · experimental':'Original graphics');graphics.current.refresh?.();if(started)focusBrowserGameCanvas(canvas.current!);};
 const enhancedShortcut=(event:ReactKeyboardEvent<HTMLCanvasElement>)=>{
  if(event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||!graphics.current.enabled)return;
  if(event.code==='KeyF'){
   event.preventDefault();event.stopPropagation();event.nativeEvent.stopImmediatePropagation();const visible=!performanceVisible;setPerformanceVisible(visible);setGraphicsNotice(visible?'FPS counter shown':'FPS counter hidden');return;
  }
  if(!performanceRunning.current)return;
  if(event.code==='KeyV'){
   event.preventDefault();event.stopPropagation();event.nativeEvent.stopImmediatePropagation();const level=nextEnhancedChaseCameraLevel((graphics.current.chaseCamera??0) as EnhancedChaseCameraLevel);graphics.current.chaseCamera=level;setGraphicsNotice(level?`Enhanced chase camera · ${ENHANCED_CHASE_CAMERA_LABELS[level]}`:'Original Stunts camera');graphics.current.refresh?.();return;
  }
  if((graphics.current.chaseCamera??0)>0&&(event.code==='KeyC'||/^F[1-4]$/.test(event.code)))graphics.current.selectOriginalCamera?.();
 };
 const audioContext=useRef<AudioContext|null>(null),[started,setStarted]=useState(autoStart);
 const surface=useRef<HTMLElement>(null),[fullscreen,setFullscreen]=useState(false),[fullscreenError,setFullscreenError]=useState('');
 const canvas=useRef<HTMLCanvasElement>(null),[status,setStatus]=useState('Ready to play Stunts'),[error,setError]=useState('');
 const [trackExplanation,setTrackExplanation]=useState('');
 useEffect(()=>{const visibility=()=>{if(document.hidden)performanceCounter.current.pause();};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);},[]);
 useEffect(()=>{const timer=window.setInterval(()=>{if(performanceActiveRef.current&&performance.now()-performanceFrameAt.current>400){performanceActiveRef.current=false;setPerformanceActive(false);}},200);return()=>window.clearInterval(timer);},[]);
 useEffect(()=>{const changed=()=>setFullscreen(document.fullscreenElement===surface.current);document.addEventListener('fullscreenchange',changed);return()=>document.removeEventListener('fullscreenchange',changed);},[]);
 const toggleFullscreen=async()=>{try{setFullscreenError('');if(document.fullscreenElement===surface.current)await document.exitFullscreen();else await surface.current?.requestFullscreen();canvas.current?.focus({preventScroll:true});}catch{setFullscreenError('Full screen is unavailable in this browser window.');}};
 useEffect(()=>{
  if(!started)return;
  onRunningChange?.(true);
  // Each opening run owns its audio clock. A development refresh can restart the
  // effect after cleanup while React retains the started state and ref.
  const runAudio=audioContext.current&&audioContext.current.state!=='closed'?audioContext.current:new AudioContext();
  audioContext.current=runAudio;void runAudio.resume();setError('');
  let music:Awaited<ReturnType<typeof createNativeMusic>>|undefined;
  let roland:Awaited<ReturnType<typeof createBrowserNativeMt32Music>>|undefined,unsubscribeRoland:(()=>void)|undefined;
  let menus:Awaited<ReturnType<typeof createBrowserNativeMenus>>|undefined;
  const demoAbort=new AbortController();
  let demoData:BrowserNativeDemoData|undefined,demoCamera=0,demoRandomState:number[]|undefined;
  let openingDisplay:BrowserOpeningDisplay|undefined,retainedSession:RetainedMenuSession|undefined;
  let disposed=false,animation=0,wake:(()=>void)|undefined;
  const element=canvas.current!;
  const openingInput=createBrowserMenuInput(element);
  let menuClockAt=openingInput.counter();
  const takeRetainedSession=()=>{
   const now=openingInput.counter();
   if(retainedSession){
    const clock=advanceRetainedMenuClock(retainedSession.clock,now-menuClockAt);
    retainedSession={...retainedSession,clock,lastInputCounter:menus?(clock.callbackCounter-menus.elapsedSinceInputPoll())>>>0:retainedSession.lastInputCounter};
   }
   menuClockAt=now;return retainedSession;
  };
  const frame=()=>new Promise<void>(resolve=>{wake=resolve;animation=requestAnimationFrame(()=>{wake=undefined;resolve();});});
  async function run(){
   setStatus('Loading original opening assets…');
   const json=async<T,>(name:string):Promise<T>=>{const r=await fetch('/game/'+name+'.json');if(!r.ok)throw Error('Original opening asset failed to load: '+name);return r.json() as Promise<T>;};
   const binary=async(name:string)=>{const r=await fetch('/game/'+name);if(!r.ok)throw Error('Original opening asset failed to load: '+name);return new Uint8Array(await r.arrayBuffer());};
   const [titles,credits,layout,shapes,materials,font,_menu,startup,baseline,objects,planes,walls,records,points,indices]=await Promise.all([json<{resources:Record<string,{bytes:number[]}>}>('title-art'),json<{resources:Record<string,number[]>}>('credits-art'),json<{text:{text:string;x:number;y:number;color:number;shadow:number}[]}>('credits-layout'),json<{resources:Record<string,{bytes:number[]}>}>('intro-shapes'),json<{palette:number[]}>('track-materials'),binary('fontdef.fnt'),binary('main-menu-art.bin'),binary('native-race-startup.bin'),binary('native-render-resources.bin'),json<IntroDrivingData['objects']>('track-objects'),json<IntroDrivingData['planes']>('collision-planes'),json<{walls:IntroDrivingData['walls']}>('collision-walls'),json<IntroDrivingData['records']>('route-records'),json<IntroDrivingData['points']>('route-point-vectors'),json<IntroDrivingData['indices']>('route-speed-indices')]);
   retainedSession=readRetainedMenuSession(startup,0x2d1a0);menuClockAt=openingInput.counter();
   if(disposed)return;
   if(soundDevice==='mt32'){roland=await createBrowserNativeMt32Music(runAudio,demoAbort.signal,rolandPower);music=roland.music;}else music=await (soundDevice==='tandy'?createNativeTandyMusic(runAudio):soundDevice==='pc-speaker'?createNativePcSpeakerMusic(runAudio):createNativeMusic(runAudio));if(disposed){music.close();roland?.output.close();return;}
   if(roland&&onRolandDevice)unsubscribeRoland=roland.power.subscribe(onRolandDevice);onRolandPower?.(roland?.power);
   applyNativeStartupAudio(initiallyMuted,music.control);
   const context=element.getContext('2d')!;context.imageSmoothingEnabled=false;
   const originalSurface=document.createElement('canvas');originalSurface.width=320;originalSurface.height=200;const originalContext=originalSurface.getContext('2d')!,originalImage=originalContext.createImageData(320,200);
   const palette=materials.palette,rows=Uint16Array.from({length:200},(_,i)=>i*320),rowArray=Array.from(rows);
   const windowPixels=new Uint8Array(65536);let video=new Uint8Array(65536);
   const display=()=>{graphics.current.refresh=display;context.imageSmoothingEnabled=false;
    for(let i=0;i<64000;i++){const c=video[i]*3;originalImage.data.set([palette[c],palette[c+1],palette[c+2],255],i*4);}
    originalContext.putImageData(originalImage,0,0);context.setTransform(1,0,0,1,0,0);context.drawImage(originalSurface,0,0,element.width,element.height);
   };
   const takeKey=(delta?:number)=>openingInput.readImmediate(delta).key;
   let lastCounter=0;const started=performance.now(),counter=()=>Math.floor((performance.now()-started)*PC_PIT_INPUT_HZ/(ORIGINAL_PIT_DIVISOR*1000));
   const timer=async()=>{await frame();const current=counter(),delta=(current-lastCounter)&65535;lastCounter=current;return delta;};
   async function timed(flow:Generator<{type:'timer'}|{type:'input';delta:number},number,number>){let step=flow.next();while(!step.done&&!disposed){step=flow.next(step.value.type==='timer'?await timer():takeKey(step.value.delta));}return step.done?step.value:0;}
   const present=(mode:number)=>timed(originalSpritePresentation({selectVideo(){},hideMouse(){},showMouse(){},drawWhole(){video.set(windowPixels);display();},drawPass(pass){video=drawOriginalTitleRevealPass(video,rows,{width:320,height:200,x:0,y:0,pixels:windowPixels.subarray(0,64000)},pass);display();}},mode));
   async function playOpening(){
    if(displayMode){music!.play('titl');openingInput.setActive(false);demoData??=await loadBrowserNativeDemoData(assets);const random=demoRandomState??Array.from(demoData.base.subarray(0x2d1a0+0x9f5c,0x2d1a0+0x9f62));const opening=await runBrowserNativeOpening(element,displayMode,demoAbort.signal,demoData,assets,random,stage=>{if(!disposed)setStatus('Original '+stage);},hercules);demoRandomState=opening.randomState;openingDisplay=opening.display;return opening.key;}
    music!.play('titl');openingInput.setActive(true);
   let selected='prod';focusBrowserGameCanvas(element);setStatus('Original title sequence');
   const titleFlow=originalTitleCards({hideMouse(){},clearVideo(){video.fill(0);display();},showMouse(){},clearWindow(){windowPixels.fill(0);},locate(name){selected=name;const b=titles.resources[name].bytes;return b[10]+256*b[11];},draw(){windowPixels.set(titles.resources[selected].bytes.slice(16));}});
   let step=titleFlow.next();while(!step.done&&!disposed){const value=step.value.type==='present'?await present(step.value.argument):await timed(originalInputWait(step.value.argument));step=titleFlow.next(value);}
   if(disposed)return;let skipped=step.done?step.value:0;
   if(!skipped){
    setStatus('Original animated logo');
    const tuning=assets.cars.find(c=>c.id==='COUN') as unknown as IntroDrivingData['tuning']&{rawSimulation:string},simulation=Uint8Array.from(tuning.rawSimulation.match(/../g)!.map(h=>parseInt(h,16)));
    const data={tuning,simulation,raw:assets.tracks.find(t=>t.name==='DEFAULT')!.raw,objects,planes,walls:walls.walls,records,points,indices} as IntroDrivingData,d=0x2d1a0;
    initializeOriginalCarSimulation(startup,d,simulation,true);
    initializeOriginalIntroScene(startup,d,(entry,point)=>{const target=trackOpponentRoutePoint(data.raw,originalIntroRoute,entry,point,records,points,objects,indices,startup.subarray(d+0x9362,d+0x9362+511));return {...target,midpoint:target.midpoint as Vector,first:target.first as Vector,second:target.second as Vector};});
    const driving=createOriginalIntroDriving(startup.subarray(d,d+65536),data),renderer=createOriginalIntroRenderer(baseline,shapes.resources,demoRandomState),raster=createOriginalCanvasRaster(renderer.memory,palette,(width,height)=>{const c=document.createElement('canvas');c.width=width;c.height=height;return c;});
    const rasterMemory=renderer.memory.slice(),rv=new DataView(rasterMemory.buffer),cs=0x209e0;
    for(const [o,n] of [[0x5d96,0x9000],[0x5d9e,0x6376],[0x5da8,320],[0x5dae,0],[0x5da0,0],[0x5db0,320],[0x5da2,320],[0x5da4,0],[0x5da6,200]])rv.setUint16(cs+o,n,true);
    for(let y=0;y<200;y++)rv.setUint16(cs+0x6376+y*2,y*320,true);
    const upgradedSurface=document.createElement('canvas');upgradedSurface.width=element.width;upgradedSurface.height=element.height;const upgradedContext=upgradedSurface.getContext('2d')!;
    let introGpu:ReturnType<typeof createUpgradedIntro>|undefined;let lastDraw:readonly number[]|undefined,lastPose:{position:Vector;heading:number}|undefined;
    const displayAnimation=()=>{if(graphics.current.enabled&&lastDraw&&lastPose){introGpu??=createUpgradedIntro(renderer.memory,introMaterials);upgradedContext.setTransform(1,0,0,1,0,0);upgradedContext.drawImage(introGpu.draw(lastDraw,lastPose,element.width,element.height),0,0);}context.setTransform(1,0,0,1,0,0);context.imageSmoothingEnabled=false;context.drawImage(graphics.current.enabled?upgradedSurface:originalSurface,0,0,element.width,element.height);};
    let camera=initialOriginalIntroCamera();lastCounter=counter();
    while(!disposed){const delta=await timer();if(disposed)break;const current=advanceOriginalIntroCamera(camera,delta,()=>{driving.tick();},()=>({position:driving.car.pose.position,heading:driving.car.pose.rotation[0]}));camera=current.state;
     upgradedContext.setTransform(element.width/320,0,0,element.height/200,0,0);upgradedContext.fillStyle='black';upgradedContext.fillRect(0,0,320,200);
     rasterMemory.fill(0,0x90000,0xa0000);
     // One source render supplies both presentations. Switching only blits a
     // cached image; it never advances the intro or its random/color state.
     renderer.render(current.draw,{position:driving.car.pose.position,heading:driving.car.pose.rotation[0]},call=>{rasterOriginalDrawCall(rasterMemory,d,cs,call);if(call.address===0x2795a)raster.draw(upgradedContext,call,[0,320,0,200]);},true);
     lastDraw=current.draw;lastPose={position:[...driving.car.pose.position] as Vector,heading:driving.car.pose.rotation[0]};
     for(let i=0;i<64000;i++){const c=rasterMemory[0x90000+i]*3;originalImage.data.set([palette[c],palette[c+1],palette[c+2],255],i*4);}originalContext.putImageData(originalImage,0,0);
     graphics.current.refresh=displayAnimation;displayAnimation();
     skipped=originalAnimatedOpeningSkip(takeKey(delta));if(skipped||current.finished)break;
    }
    demoRandomState=renderer.randomState;raster.dispose();introGpu?.close();
   }
   if(disposed)return;
   if(!skipped){
    setStatus('Original credits');windowPixels.fill(0);video.fill(0);display();
    const names=['arow','arrw','arw1','arw2','arw3','arw4','arw5','arw6','arw7','arw8','type'];
    const art=names.map(name=>{const b=credits.resources[name] as number[],v=new DataView(Uint8Array.from(b).buffer);return {...expandEditorArt(b),x:v.getInt16(8,true),y:v.getInt16(10,true)};});
    const draw=(destination:Uint8Array,index:number,x=art[index].x,y=art[index].y)=>drawEditorClippedRaster(destination,320,art[index],x,y,'copy',{left:0,right:320,top:0,bottom:200});
    const clearBelow=(y:number)=>windowPixels.fill(0,y*320,64000);
    const flow=originalIntroCredits({arrow:art[1],finalY:art[0].y,drawText(){for(const text of layout.text){drawOriginalFont(windowPixels,font,text.text,text.x+1,text.y+1,text.shadow,rowArray);drawOriginalFont(windowPixels,font,text.text,text.x,text.y,text.color,rowArray);}},slide(x,y,width,height){draw(video,1,x,y);for(let row=y;row<Math.min(200,y+height);row++)video.fill(0,row*320+Math.min(320,x+width),row*320+Math.min(320,x+width+32));display();},frame(index,y){clearBelow(y);draw(windowPixels,index);video.set(windowPixels.subarray(y*320,64000),y*320);display();},finish(y){clearBelow(y);draw(windowPixels,0);draw(windowPixels,10);}});
    let creditStep=flow.next();while(!creditStep.done&&!disposed){const request=creditStep.value;const value=request.type==='timer'?await timer():request.type==='input'?takeKey(request.delta):request.type==='present'?await present(request.mode):await timed(originalInputWait(request.duration));creditStep=flow.next(value);}
    skipped=creditStep.done?creditStep.value:0;
   }
   return skipped;
   }
   let openingKey=await playOpening();
   if(disposed)return;
   openingInput.setActive(false);
   menus=await createBrowserNativeMenus({settings:{mouse:false,joystick:false,graphics:0},graphics:graphics.current,canvas:element,assets,music,displayMode,hercules,signal:demoAbort.signal,track:{name:'DEFAULT',path:directory,raw:initialTrack??[...assets.tracks.find(t=>t.name==='DEFAULT')!.raw]},onScreen:screen=>{if(!disposed)setStatus(screen==='main'?'Original main menu':screen==='editor'?'Original track editor':screen==='race'?'Stunts':screen==='results'?'Race results':screen==='replay'?'Replay':'Original '+screen+' menu');}});
   if(disposed){menus.close();return;}
   element.dataset.openingComplete='true';
   for(;;){
    if(disposed)return;openingInput.setActive(false);
    if(originalOpeningExitDecision(openingKey??0)==='confirm'){
     menus.setInputActive(false);setStatus('Exit Stunts?');
     if(originalOpeningExitDecision(27,await confirmBrowserOpeningExit(element,demoAbort.signal,openingDisplay))==='exit'){onBack();return;}
     openingInput.setActive(true);openingKey=await playOpening();continue;
    }
    menus.setInputActive(true);music.play('slct');
    const transition=await menus.run();menus.setInputActive(false);if(disposed)return;
    if(transition.type==='intro'){openingInput.setActive(true);openingKey=await playOpening();continue;}
    if(transition.type==='exit'){onBack();return;}
    if(transition.type==='demo'){
     setStatus('Loading original demonstration');
     await menus.fadeMusic();if(disposed)return;
     demoData??=await loadBrowserNativeDemoData(assets);if(soundDevice==='pc-speaker')demoData.soundDevice={kind:'pc-speaker',port61:()=>0};else if(soundDevice==='tandy')demoData.soundDevice={kind:'tandy',port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests};else if(soundDevice==='mt32')demoData.soundDevice={kind:'mt32',execute:executeReadyMt32Program,async executeInitialization(program){const writes:number[][]=[];const result=await executeCooperativeReadyMt32Program(program,{write(batch){writes.push(...batch);},cancelled:()=>disposed});return {result,writes};}};if(disposed)return;
     const restored=await runBrowserNativeDemo({assets,graphicsSwitch:graphics.current,canvas:element,context:runAudio,mt32Output:roland?.output,displayMode,hercules,data:demoData,menu:{configuration:menus.configuration,track:menus.track.raw,name:menus.track.name,path:menus.track.path,camera:demoCamera,randomState:demoRandomState,retainedSession:takeRetainedSession(),graphics:menus.settings.graphics,soundEnabled:music.settings.soundEnabled},joystickEnabled:menus.settings.joystick,signal:demoAbort.signal,onFrame(){if(!disposed)setStatus('Original demonstration — press a key to return');}});
     demoCamera=restored.camera;demoRandomState=restored.randomState;retainedSession=restored.retainedSession;menuClockAt=openingInput.counter();
     menus.configuration.splice(0,24,...restored.configuration);menus.track.raw=restored.track;continue;
    }
    if(transition.type==='drive'||transition.type==='replay'){
     const recording=transition.type==='replay'?menus.selectedReplay:undefined;if(transition.type==='replay'&&!recording)throw Error('Original replay selection is missing');
     setTrackExplanation('');setStatus(recording?'Preparing replay':'Preparing race');await menus.fadeMusic();if(disposed)return;
     demoData??=await loadBrowserNativeDemoData(assets);if(soundDevice==='pc-speaker')demoData.soundDevice={kind:'pc-speaker',port61:()=>0};else if(soundDevice==='tandy')demoData.soundDevice={kind:'tandy',port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests};else if(soundDevice==='mt32')demoData.soundDevice={kind:'mt32',execute:executeReadyMt32Program,async executeInitialization(program){const writes:number[][]=[];const result=await executeCooperativeReadyMt32Program(program,{write(batch){writes.push(...batch);},cancelled:()=>disposed});return {result,writes};}};if(disposed)return;
     let restored:Awaited<ReturnType<typeof runBrowserNativeManualRace>>;
     try{restored=await runBrowserNativeManualRace({context:runAudio,mt32Output:roland?.output,displayMode,hercules,data:demoData,menus,replay:recording,menu:{configuration:transition.configuration,track:menus.track.raw,name:menus.track.name,path:menus.track.path,camera:demoCamera,randomState:demoRandomState,retainedSession:takeRetainedSession(),graphics:menus.settings.graphics,mouse:menus.settings.mouse,joystick:menus.settings.joystick,soundEnabled:music.settings.soundEnabled},signal:demoAbort.signal,stopMusic:music.stop,onStage(stage){if(disposed)return;performanceRunning.current=stage==='race';if(performanceRunning.current)graphics.current.setPerformancePaused?.(false);else{graphics.current.chaseCamera=0;graphics.current.resetPerformance?.();}setStatus(({loading:'Preparing race',race:'Stunts',results:'Race results',seeking:'Preparing replay'})[stage]);},onFrame(frame,mode,clock,blocked){element.dataset.raceFrame=String(frame);element.dataset.raceMode=String(mode);element.dataset.raceClock=String(clock);element.dataset.raceClockBlocked=String(blocked);element.dataset.raceAudioState=runAudio.state; element.dataset.raceAudioTime=String(runAudio.currentTime);}});}
     catch(reason){
      const code=originalTrackValidationCode(reason);if(code===null)throw reason;
      performanceRunning.current=false;graphics.current.resetPerformance?.();setTrackExplanation(trackValidationExplanation(code));
      menus.setInputActive(true);try{await menus.showTrackValidationError(code);}finally{menus.setInputActive(false);}
      setStatus('Main menu');continue;
     }
     performanceRunning.current=false;graphics.current.chaseCamera=0;graphics.current.resetPerformance?.();
     demoCamera=restored.camera;demoRandomState=restored.randomState;retainedSession=restored.retainedSession;menuClockAt=openingInput.counter();menus.configuration.splice(0,24,...restored.configuration);menus.track.raw=restored.track;setStatus('Main menu');continue;
    }
   }
  }
  void run().catch(e=>{openingInput.close();if(!disposed)onRunningChange?.(false);unsubscribeRoland?.();onRolandDevice?.(undefined);onRolandPower?.(undefined);menus?.close();music?.close();roland?.output.close();void runAudio.close().catch(()=>{});if(!disposed)setError(e instanceof Error?e.message:String(e));});
  return()=>{graphics.current.refresh=undefined;disposed=true;onRunningChange?.(false);demoAbort.abort();unsubscribeRoland?.();onRolandDevice?.(undefined);onRolandPower?.(undefined);menus?.close();music?.close();roland?.output.close();void runAudio.close().catch(()=>{});cancelAnimationFrame(animation);wake?.();openingInput.close();};
 },[assets,started,soundDevice,displayMode,initiallyMuted,hercules,directory,initialTrack,onRolandDevice,onRolandPower,rolandPower,onRunningChange]);
 return <section ref={surface} className={embedded?"launcher-game-session":undefined}><div className="game-toolbar"><button onClick={onBack}>{backLabel}</button><button aria-pressed={upgraded} onClick={toggleGraphics}>{upgraded?"Use original graphics":"Enable graphics update"}</button><span className="sr-only" role="status">{status}</span>{embedded&&<button onClick={()=>void toggleFullscreen()}>{fullscreen?"Exit full screen":"Full screen"}</button>}{!started&&!embedded&&<button onClick={()=>{audioContext.current=new AudioContext();void audioContext.current.resume();setTrackExplanation('');setStarted(true);}}>PLAY STUNTS</button>}</div><output className="sr-only">{graphicsNotice||"Original graphics"}</output><div className={embedded?"launcher-screen":undefined}><canvas ref={canvas} width={1280} height={800} tabIndex={0} aria-label="Native Stunts opening, menus, races and track editor" onKeyDownCapture={enhancedShortcut} style={{width:embedded?'100%':'min(100%, calc((100dvh - 220px) * 4 / 3))',height:'auto',aspectRatio:'4 / 3',margin:'0 auto',display:'block',background:'#000',imageRendering:'auto'}}/>{upgraded&&performanceVisible&&performanceActive&&performanceStats&&<output className="enhanced-performance" aria-label={`Current ${Math.round(performanceStats.currentFps)} FPS, average ${Math.round(performanceStats.averageFps)} FPS, 1% low ${Math.round(performanceStats.low1Fps)} FPS`}><span><small>FPS</small><strong>{Math.round(performanceStats.currentFps)}</strong></span><span><small>AVG</small><strong>{Math.round(performanceStats.averageFps)}</strong></span><span><small>1% LOW</small><strong>{Math.round(performanceStats.low1Fps)}</strong></span></output>}{embedded&&!started&&<div className="launcher-screen-idle stunts-game-idle"><img className="stunts-idle-art" src="/game/menu.png" alt=""/><div className="stunts-idle-shade"/><button className="launcher-play" onClick={()=>{audioContext.current=new AudioContext();void audioContext.current.resume();setTrackExplanation('');setStarted(true);}}>PLAY STUNTS</button></div>}</div>{fullscreenError&&<p role="status">{fullscreenError}</p>}{trackExplanation&&<output className="original-track-explanation"><strong>Why Stunts showed this:</strong> {trackExplanation}</output>}{error&&<p role="alert">{error}</p>}</section>;
}
