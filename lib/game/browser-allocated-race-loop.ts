import type {createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import type {createBrowserNativeMenus} from './browser-native-menus.ts';
import type {createBrowserRaceAudio} from './browser-race-audio.ts';
import {handleNativeRecordingFull} from './native-recording-full.ts';
import {pushOriginalCursorState,popOriginalCursorState} from './allocated-mouse-selection.ts';
type Runtime=Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;
type Menus=Awaited<ReturnType<typeof createBrowserNativeMenus>>;
type Presentation=Awaited<ReturnType<Menus['allocatedRacePresentation']>>;
/** Browser boundary for the original manual outer loop. Replay loading can
 * replace the simulation while retaining the same browser audio output. */
export async function runBrowserAllocatedRaceLoop(runtime:Runtime,menus:Pick<Menus,'replayMenu'|'saveReplay'>,presentation:Presentation,audio:Pick<Awaited<ReturnType<typeof createBrowserRaceAudio>>,'write'>,services:{signal:AbortSignal;showWaiting():void;loadReplay(runtime:Runtime,presentation:Presentation):Promise<{runtime:Runtime;presentation:Presentation}|void>;onFrame?:(frame:number,mode:number,clock:number,blocked:number)=>void}){
 const d=0x2d1a0,memory=()=>runtime.session.state.memory;
 const aborted=()=>{if(services.signal.aborted)throw new DOMException('Native race closed','AbortError');};
 const pauseAudio=()=>audio.write(runtime.audio.produce()),selectMouse=()=>presentation.selectMouse(audio.write);
 // 161EA/16308 share the live directory at0098 and filename at00EA.
 // Loading and cancelled edits both change these source-owned buffers.
 const saveReplay=async()=>{
  const read=(at:number,limit:number)=>{const bytes=memory();let value='';for(let i=0;i<limit&&bytes[d+at+i];i++)value+=String.fromCharCode(bytes[d+at+i]);return value;};
  const state={name:read(0xea,8),path:read(0x98,81)};
  try{await menus.saveReplay(runtime.session,state,pauseAudio,presentation);}
  finally{for(const [at,value] of [[0x98,state.path],[0xea,state.name]] as const)memory().set(Uint8Array.from([...value].map(char=>char.charCodeAt(0)&255).concat(0)),d+at);}
 };
 const replayMenu=()=>menus.replayMenu(runtime.session,{pauseAudio,resetCounter:()=>presentation.releaseInput(),resetMouse:presentation.resetMouse,selectControl:presentation.control,loadReplay:async()=>{const replacement=await services.loadReplay(runtime,presentation);if(replacement){const previous=presentation;runtime=replacement.runtime;presentation=replacement.presentation;previous.close();}},saveReplay,changeGraphics:()=>presentation.changeGraphics(audio.write)},runtime.pixels,{dialog:presentation.dialog,present:presentation.present});
 const replayControls=()=>runtime.replayControls({...presentation,pauseAudio,selectMouse,resetMouse:presentation.resetMouse,menu:replayMenu,waitMessage(){runtime.drawReplayWait();presentation.present();}});
 runtime.renderCockpitWorld();presentation.presentWorld();
 for(;;){
  aborted();await presentation.nextFrame();aborted();
  if(memory()[d+0xaa77]){
   let seeReplay=false;const state={pending:memory()[d+0xaa77],done:memory()[d+0x8ff4]};
   await handleNativeRecordingFull({suspendInput:()=>pushOriginalCursorState(memory(),d),resumeInput:()=>popOriginalCursorState(memory(),d,presentation.hideCursor),pauseAudio:()=>audio.write(runtime.dialogAudio('pause-audio')),resumeAudio:()=>audio.write(runtime.dialogAudio('resume-audio')),resetCounter(){const m=memory();new DataView(m.buffer,m.byteOffset,m.byteLength).setUint16(d+0x4090,0,true);},dialog:(resource,mode,selected)=>presentation.dialog(resource,mode,selected,new DataView(memory().buffer).getUint16(d+0x4ec2,true)),raceEvent(){seeReplay=true;}},state);
   runtime.session.resumeRecording(seeReplay?1:0);aborted();
  }
  runtime.renderCockpitWorld();presentation.presentWorld();runtime.finishRenderedFrame();
  const m=memory();services.onFrame?.(new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(d+0x8c26,true),m[d+0xa3c2],new DataView(m.buffer,m.byteOffset,m.byteLength).getUint32(d+0x407a,true),m[d+0x4090]);
  const action=await runtime.session.finishIteration({...presentation,pauseAudio,selectMouse,replayControls});
  if(action==='exit')break;
 }
 aborted();
 await runtime.finish({writeAudio:audio.write,async gameCounter(){await presentation.nextFrame();aborted();const m=memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint32(d+0x407a,true);},releaseInput:presentation.releaseInput,showWaiting:services.showWaiting,copyBackBuffer(){},resetMouse:presentation.resetMouse,opponent:presentation.opponent});
 return runtime;
}
