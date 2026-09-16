import {crashOriginalRaceMemory} from './crash-race-memory.ts';
import {tickOriginalRaceTimer,type NativeRaceTimerHost} from './native-race-timer.ts';
import {finishNativeDemoFrame,type NativeDemoFrameEndHost} from './native-demo-frame-end.ts';
import {enterNativeRaceSimulation,type NativeRaceSimulationEntryHost} from './native-race-simulation-entry.ts';
import {captureNativeRaceInput} from './native-race-input.ts';
import type {NativeRaceInputHost} from './race-input-selection.ts';
import {waitForNativeOpponent,type NativeOpponentWaitHost} from './native-opponent-wait.ts';
import {restoreOriginalReplayBank} from './restore-replay-bank.ts';
import {finishNativeRaceIteration,type NativeRaceIterationEndHost} from './native-race-iteration-end.ts';
import {fixOriginalMouseRecording} from './race-mouse-fixup.ts';
import {runNativeReplayMenu,type NativeReplayMenuHost} from './native-replay-menu.ts';
import {runNativeReplayControls,type NativeReplayControlsHost} from './native-replay-controls.ts';
import {initializeOriginalCarSimulation} from './initialize-car-simulation.ts';
import {originalStartTruckEntry} from './start-truck-entry.ts';
import {finishOriginalStartTruck} from './start-truck-handoff.ts';
import {resetOriginalInactiveRaceClock} from './inactive-race-clock.ts';
import {captureOriginalRaceInput} from './capture-race-input.ts';
import {requestOriginalRaceReplay} from './request-race-replay.ts';
import {originalRaceKeyCommand,type OriginalRaceKeyServices} from './race-key-command.ts';
import {continueNativeReplay,type NativeReplayContinueHost} from './native-replay-continue.ts';
import {saveNativeReplayMemory} from './native-replay-memory-save.ts';
import {scrubNativeReplay,type NativeReplayScrubHost} from './native-replay-scrub.ts';
import {restoreReplayCheckpoint} from './restore-replay-checkpoint.ts';
import {enterManualRace} from './manual-race-entry.ts';
import {seekRecordedTwoCarRace} from './seek-recorded-two-car-race.ts';
import {readOriginalRouteSamples} from './read-route-samples-memory.ts';
import {prepareRaceTrack} from './prepare-race-track.ts';
import {analyzeRoute} from '../physics/route-analysis.ts';
import {writeAnalyzedTrackMemory} from './write-analyzed-track-memory.ts';
import {loadCachedVleBank} from './load-cached-vle-bank.ts';
import {prepareOpponentPathMemory} from './prepare-opponent-path-memory.ts';
import {freeResource} from './free-resource.ts';
import {initializeRaceSession} from './initialize-race-session.ts';
import {readRecordedTwoCarRace,stepRecordedTwoCarRace} from './recorded-two-car-race.ts';
import {playerRouteMemory,recordedPlayerRouteStackFrame} from '../physics/player-route-memory.ts';
import {trackRoutePoint,trackOpponentRoutePoint} from '../physics/track-route-point.ts';
import type {RecordedRaceResources} from './recorded-single-player-race.ts';
import type {TrackGeometry} from '../physics/track-contact.ts';
import type {Vector} from '../physics/math.ts';

type Analysis=Parameters<typeof analyzeRoute>;
export interface NativeRaceData {
 startup:Uint8Array;packedOpponent:Uint8Array;simulation:Uint8Array;
 opponent?:{simulation:Uint8Array;tuning:RecordedRaceResources['tuning']};
 tuning:RecordedRaceResources['tuning'];raw:Analysis[0];records:Analysis[1];vectors:Analysis[2];samples:Analysis[3];objects:RecordedRaceResources['track']['objects'];
 points:Parameters<typeof trackRoutePoint>[5];indices:Parameters<typeof trackOpponentRoutePoint>[7];
 planes:RecordedRaceResources['track']['planes'];walls:RecordedRaceResources['track']['walls'];
}
export function originalStartFinishPosts(memory:Uint8Array,d:number,simulation:DataView,start:{column:number;row:number;angle:number;hill:0|1}){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return {
  column:start.column,terrainRow:start.row,
  height:view.getInt16(d+0x122+start.hill*2,true),heading:start.angle,
  dimensions:[0,1,2].map(a=>simulation.getInt16(200+a*2,true)) as Vector,
  radius:simulation.getInt16(206,true),
 };
}
export function originalRaceTrackGeometry(memory:Uint8Array,d:number,simulation:DataView,start:{column:number;row:number;angle:number;hill:0|1},base:Pick<TrackGeometry,'raw'|'objects'|'planes'|'walls'>):TrackGeometry{
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return {...base,landmarks:{dimensions:[0,1,2].map(a=>simulation.getInt16(200+a*2,true)) as Vector,radius:simulation.getInt16(206,true),hillHeight:view.getInt16(d+0x124,true)},posts:originalStartFinishPosts(memory,d,simulation,start)};
}
/** Browser-owned native race state. The startup data retains original uninitialized
 * bytes; execution is entirely TypeScript, with no DOS runtime or trace playback.
 */
export function createNativeRaceSession(data:NativeRaceData,options:{transporter?:boolean;opponentSelected?:number;configuration?:ReadonlyArray<number>;replayInputs?:Uint8Array;deferSimulationEntry?:boolean;produceAudio?:boolean;preparedOpponentPath?:readonly number[];preparedSimulationMemory?:boolean;preparedTrackMemory?:boolean}={}){
 if(options.deferSimulationEntry&&options.transporter)throw Error('Deferred simulation entry must enter the transporter through the original entry routine');
 const d=0x2d1a0,{raw,records,vectors,samples,objects,points,indices,tuning}=data;
 const prepared=prepareRaceTrack(raw,records,vectors,samples,objects,undefined,options.preparedTrackMemory?{samples:readOriginalRouteSamples(data.startup,d)}:undefined);
 let memory=data.startup.slice();
 if(options.configuration){if(options.configuration.length!==24)throw Error('Original race configuration requires24 bytes');memory.set(options.configuration,d+0x8fc2);memory.set(options.configuration,d+0x9b44);}
 const opponentData=data.opponent??{simulation:data.simulation,tuning};
 if(!options.preparedSimulationMemory){initializeOriginalCarSimulation(memory,d,data.simulation,false);initializeOriginalCarSimulation(memory,d,opponentData.simulation,true);}
 const opponentSelected=options.opponentSelected??options.configuration?.[6]??1;memory[d+0x8fc8]=opponentSelected;
 let path:number[]=[];
 if(opponentSelected&&options.preparedOpponentPath){path=Array.from(options.preparedOpponentPath);}
 else if(opponentSelected){
 memory.set(new TextEncoder().encode('opp'+opponentSelected+'.pre\0'),d+0xd06e);
 const loaded=loadCachedVleBank(memory,d,0xd06e,data.packedOpponent);
 if(loaded.error||!loaded.resource)throw Error(`Opponent resource load failed: ${loaded.error}`);
 memory=writeAnalyzedTrackMemory(loaded.memory,d,raw,analyzeRoute(raw,records,vectors,samples,objects)).memory;
 const setup=prepareOpponentPathMemory(memory,d,loaded.segment*16,loaded.resource.length,prepared.route);
 if(!setup.path)throw Error('Opponent could not find a route');
 path=setup.path;const released=freeResource(setup.memory,d,0,loaded.segment);
 if(released.error)throw Error('Opponent resource release failed');memory=released.memory;
 }else if(!options.preparedTrackMemory)memory=writeAnalyzedTrackMemory(memory,d,raw,analyzeRoute(raw,records,vectors,samples,objects)).memory;
 const lookup=(m:Uint8Array,entry:number,point:number)=>{const result=trackOpponentRoutePoint(raw,prepared.route,entry,point,records,points,objects,indices,m.subarray(d+0x9362,d+0x9362+511));return {...result,midpoint:result.midpoint as Vector,first:result.first as Vector,second:result.second as Vector};};
 const initialize=(m:Uint8Array,argument=0)=>initializeRaceSession(m,d,data.simulation,opponentData.simulation,{...prepared.start,transmission:m[d+0x8fc7],mode:argument,opponentSelected,opponentPath:path},(entry,point,opponent)=>opponent?lookup(m,entry,point):trackRoutePoint(raw,prepared.route,entry,point,records,points,objects)).memory;
 if(options.replayInputs){
  const view=new DataView(memory.buffer),offset=view.getUint16(d+0x9c40,true),segment=view.getUint16(d+0x9c42,true);
  options.replayInputs.forEach((value,index)=>{memory[segment*16+((offset+index)&65535)]=value;});
  view.setUint16(d+0x8fd8,options.replayInputs.length,true);if(!options.deferSimulationEntry)memory=enterManualRace(memory,d);
 }
 if(!options.deferSimulationEntry)memory=initialize(memory,options.transporter?-1:0);
 if(options.transporter){
  const view=new DataView(memory.buffer),entry=originalStartTruckEntry([0,1,2].map(a=>view.getInt32(d+0x8c38+a*4,true)) as Vector,view.getInt16(d+0x9b2a,true));
  memory[d+0xa3a4]=0;memory[d+0xa34e]=0;memory[d+0x7fee]=1;
  memory[d+0xa3c2]=entry.mode;memory[d+0x8018]=entry.flags;
  entry.position.forEach((value,a)=>view.setInt32(d+0x8c38+a*4,value,true));
 }
 let state=readRecordedTwoCarRace(memory,d),replaySeeking=false;
 const initial=memory.slice(),v=new DataView(memory.buffer),sim=new DataView(data.simulation.buffer,data.simulation.byteOffset,data.simulation.byteLength);
 const wheels=Array.from({length:4},(_,i)=>[0,1,2].map(a=>sim.getInt16(210+i*6+a*2,true)) as Vector);
 // Original 8DF4..8F21 checks both start/finish supports using the current car's bounds.
 const track=originalRaceTrackGeometry(memory,d,sim,prepared.start,{raw,objects,planes:data.planes,walls:data.walls});
 const opponentSimulation=new DataView(opponentData.simulation.buffer,opponentData.simulation.byteOffset,opponentData.simulation.byteLength);
 const opponentWheels=Array.from({length:4},(_,i)=>[0,1,2].map(a=>opponentSimulation.getInt16(210+i*6+a*2,true)) as Vector);
 const opponentTrack=originalRaceTrackGeometry(memory,d,opponentSimulation,prepared.start,{raw,objects,planes:data.planes,walls:data.walls});
 const start={x:v.getInt16(d+0xa3e2+prepared.start.column*2,true),z:v.getInt16(d+0xa796+prepared.start.row*2,true),angle:prepared.start.angle};
 let recording:Uint8Array|undefined=options.replayInputs?memory.slice():undefined,recordedFrames=options.replayInputs?.length??0;
 const resources=(m:Uint8Array,sp=0xff00,incomingSI=0):Parameters<typeof stepRecordedTwoCarRace> extends [unknown,...infer R]?R:never=>{
  const v=new DataView(m.buffer),graph=playerRouteMemory(prepared.graph,address=>m[address],d,d/16,recordedPlayerRouteStackFrame(sp));
  return [{caller:{stackSegment:d/16,entryStackPointer:sp,incomingSI},produceAudio:options.produceAudio,tuning,wheels,track,trackside:prepared.trackside,navigation:[graph,raw,prepared.route,records,points,objects,start]},{tuning:opponentData.tuning,wheels:opponentWheels,track:opponentTrack,path,lookup:(entry,point)=>lookup(m,entry,point),speedProfile:m[d+0x9362],startX:start.x,startZ:start.z,startAngle:start.angle,flags:m[d+0x8018],timeAdjustment:v.getUint16(d+0xa034,true)}];
 };
 const simulateCaptured=(incomingSI=0,fixMouse=true)=>{
   const m=state.memory;
   // Original 13b56..13b6f applies device steering to this recorded frame.
   if(fixMouse&&(m[d+0x12c]||m[d+0x4602])&&m[d+0xa3c2]===0)fixOriginalMouseRecording(m,d);
   const result=stepRecordedTwoCarRace(state,...resources(m,0xff00,incomingSI));
   state=result.state;
   const handedOff=finishOriginalStartTruck(state.memory,d,initialize);
   if(handedOff!==state.memory)state=readRecordedTwoCarRace(handedOff,d);
   if(resetOriginalInactiveRaceClock(state.memory,d)){
    const stats=[...state.player.driving.race.stats];stats[2]=0;
    state={...state,player:{...state.player,driving:{...state.player.driving,race:{...state.player.driving.race,stats}}}};
   }
   return {...result,state};
 };
 return {
  get state(){return state;},
  audioMemory:{
   read:()=>state.memory,
   write(next:Uint8Array){
    if(next.length!==state.memory.length)throw Error('Audio memory must preserve the original address space');
    state={...state,memory:next,player:{...state.player,driving:{...state.player.driving,race:{...state.player.driving.race,audioEnabled:next[d+0x9fea]!==0,audioHandles:[new DataView(next.buffer,next.byteOffset,next.byteLength).getUint16(d+0x8016,true),new DataView(next.buffer,next.byteOffset,next.byteLength).getUint16(d+0x86de,true)]}}}};
   },
   // Browser callbacks run serially outside the original guarded stack region.
   stackMatches:()=>true,
  },
  /** Resource and outer-race coordinators may replace the memory image. Keep
   * the parsed simulation state synchronized with every such replacement. */
  originalMemory:{
   memory:()=>state.memory,
   writeMemory(next:Uint8Array){
    if(next.length!==state.memory.length)throw Error('Race memory must preserve the original address space');
    state=readRecordedTwoCarRace(next,d);
   },
  },
  async enterSimulation(host:Pick<NativeRaceSimulationEntryHost,'resetMouse'|'key'>,caller:{entryStackPointer:number;incomingSI:number;afterStep?:(frame:ReturnType<typeof stepRecordedTwoCarRace>)=>void}){
   const branch=await enterNativeRaceSimulation({...host,memory:()=>state.memory,
    initialize(mode){state=readRecordedTwoCarRace(initialize(state.memory,mode),d);},
    seekReplay(frame){state=readRecordedTwoCarRace(restoreReplayCheckpoint(state.memory,d,frame,initialize).memory,d);},
    stepReplay(){const [player,opponent]=resources(state.memory,caller.entryStackPointer,caller.incomingSI);const frame=stepRecordedTwoCarRace(state,player,opponent);state=frame.state;caller.afterStep?.(frame);},
   },d);
   state=readRecordedTwoCarRace(state.memory,d);return branch;
  },
  initializeLoadedReplay(){state=readRecordedTwoCarRace(initialize(state.memory,-1),d);return state;},
  restoreReplayBank(packed:Uint8Array){state=readRecordedTwoCarRace(restoreOriginalReplayBank(state.memory,d,packed),d);},
  timerTick(host:Omit<NativeRaceInputHost,'memory'>&Pick<NativeRaceTimerHost,'stackMatches'|'audioSample'>){
   tickOriginalRaceTimer({...host,memory:()=>state.memory,capture(forced){captureNativeRaceInput({...host,memory:()=>state.memory},d,forced);}},d);
   state=readRecordedTwoCarRace(state.memory,d);
  },
  /** Original13B56..13B9C catches up to the timer before rendering. Rollout
   * handoff is deliberately deferred until the displayed frame is complete. */
  advanceCaptured(caller:{entryStackPointer:number;incomingSI:number},afterStep?:(result:ReturnType<typeof stepRecordedTwoCarRace>)=>void){
   const effects:ReturnType<typeof stepRecordedTwoCarRace>['effects'][number][]=[],audioRequests:ReturnType<typeof stepRecordedTwoCarRace>['audioRequests'][number][]=[];let frames=0;
   // Browser IRQ pumping may occur inside an asynchronous scrub. The source
   // outer catch-up loop cannot run while its nested seek caller owns frames.
   if(replaySeeking)return {frames,effects,audioRequests};
   const word=(at:number)=>new DataView(state.memory.buffer,state.memory.byteOffset,state.memory.byteLength).getUint16(d+at,true);
   while(word(0x8c26)!==word(0x73b2)){
    const m=state.memory;if((m[d+0x12c]||m[d+0x4602])&&m[d+0xa3c2]===0)fixOriginalMouseRecording(m,d);
    const [player,opponent]=resources(m,caller.entryStackPointer,caller.incomingSI),result=stepRecordedTwoCarRace(state,player,opponent);state=result.state;frames++;effects.push(...result.effects);audioRequests.push(...result.audioRequests);afterStep?.(result);
   }
   resetOriginalInactiveRaceClock(state.memory,d);state=readRecordedTwoCarRace(state.memory,d);return {frames,effects,audioRequests};
  },
  finishRenderedFrame(host:Pick<NativeDemoFrameEndHost,'key'|'controls'>){
   const next=finishOriginalStartTruck(state.memory,d,initialize);state=readRecordedTwoCarRace(next,d);
   const action=finishNativeDemoFrame({...host,memory:()=>state.memory},d);state=readRecordedTwoCarRace(state.memory,d);return action;
  },
  crash(cause:1|2|3|4|5,selected:0|1){const effects=crashOriginalRaceMemory(state.memory,d,cause,selected);state=readRecordedTwoCarRace(state.memory,d);return effects;},
  captureInput(host:Omit<NativeRaceInputHost,'memory'>,forced=0){
   const result=captureNativeRaceInput({...host,memory:()=>state.memory},d,forced);state=readRecordedTwoCarRace(state.memory,d);return result;
  },
  stepCaptured(incomingSI=0){return simulateCaptured(incomingSI);},
  async waitForOpponent(host:Omit<NativeOpponentWaitHost,'memory'|'captureInput'|'simulate'>,caller?:{entryStackPointer:number;afterStep?:(result:ReturnType<typeof stepRecordedTwoCarRace>)=>void}){
   await waitForNativeOpponent({...host,memory:()=>state.memory,
    captureInput(){captureOriginalRaceInput(state.memory,d,0);state=readRecordedTwoCarRace(state.memory,d);},
    simulate:incomingSI=>{if(caller){const result=stepRecordedTwoCarRace(state,...resources(state.memory,caller.entryStackPointer,incomingSI));state=result.state;caller.afterStep?.(result);}else simulateCaptured(incomingSI,false);},
   },d);
   state=readRecordedTwoCarRace(state.memory,d);
  },
  get replaying(){return !!recording;},
  get introducing(){return state.memory[d+0xa3c2]===1;},
  /** Dispatch a DOS key through the original race command handler. Device
   * selection stays with the browser host; initialization stays in this session. */
  command(key:number,host:Pick<OriginalRaceKeyServices,'selectMouse'|'resetMouse'>){
   let memory=state.memory;
   const handled=originalRaceKeyCommand(memory,d,key,{
    ...host,
    initialize(mode){memory=initialize(memory,mode);resetOriginalInactiveRaceClock(memory,d);},
   });
   state=readRecordedTwoCarRace(memory,d);return handled;
  },
  /** Browser device selection opens the original modal mouse information.
   * Re-read live memory after it closes: hardware polling can replace state. */
  async commandAsync(key:number,host:Pick<OriginalRaceKeyServices,'selectMouse'|'resetMouse'>){
   const value=key&65535;if(value===77||value===109)await host.selectMouse();
   return this.command(key,{...host,selectMouse(){}});
  },
  /** Original manual outer-loop tail. The host owns devices and replay UI;
   * this session retains recording history and runs the real initializer. */
  async finishIteration(host:Omit<NativeRaceIterationEndHost,'memory'|'command'> & Pick<OriginalRaceKeyServices,'selectMouse'>){
   const action=await finishNativeRaceIteration({...host,memory:()=>state.memory,
    command:key=>this.commandAsync(key,host).then(()=>{}),
    replayControls:async()=>{
     if(!recording){
      recordedFrames=new DataView(state.memory.buffer,state.memory.byteOffset,state.memory.byteLength).getUint16(d+0x8fd8,true);
      recording=state.memory.slice();
     }
     await host.replayControls();
    },
   },d);
   if(action==='initialize'){
    const memory=initialize(state.memory,-1);resetOriginalInactiveRaceClock(memory,d);state=readRecordedTwoCarRace(memory,d);
   }else state=readRecordedTwoCarRace(state.memory,d);
   return action;
  },
  /** Original ordinary-key startup skip (14250..1426C). */
  skipIntroduction(){
   if(state.memory[d+0xa3c2]!==1)return state;
   const memory=state.memory.slice();memory[d+0xa3c2]=0;memory[d+0x7fee]=0;
   const initialized=initialize(memory,-1);resetOriginalInactiveRaceClock(initialized,d);state=readRecordedTwoCarRace(initialized,d);return state;
  },
  get length(){return recording?recordedFrames:new DataView(state.memory.buffer,state.memory.byteOffset,state.memory.byteLength).getUint16(d+0x8fd8,true);},
  /** Export the live original bank through a caller-owned file service. */
  saveReplay(write:(bytes:Uint8Array)=>Promise<number>){
   const memory=state.memory;
   return saveNativeReplayMemory(memory,d,{write:async(offset,segment,length)=>{
    const start=segment*16+offset;
    if(length<0||start+length>memory.length)throw Error('Original replay write is outside the supported recording bank');
    return write(memory.slice(start,start+length));
   }});
  },
  /** Original continuation-dialog result; its audio/input suspension belongs
   * to the UI host. Escape (-1) follows Continue Now. */
  resumeRecording(choice:number){
   const memory=state.memory;if(!memory[d+0xaa77])throw Error('No original recording prompt is pending');
   if((choice&65535)!==65535&&(choice&65535)!==0){requestOriginalRaceReplay(memory,d);memory[d+0x8ff4]=1;}
   memory[d+0xaa77]=0;state=readRecordedTwoCarRace(memory,d);return state;
  },
  async continueReplay(restart:boolean,host:Omit<NativeReplayContinueHost,'memory'|'initialize'>){
   if(!recording)throw Error('No native replay is active');
   let memory=state.memory;
   const continued=await continueNativeReplay({...host,memory:()=>memory,initialize(mode){memory=initialize(memory,mode);}},d,restart);
   state=readRecordedTwoCarRace(memory,d);
   if(continued){recording=undefined;recordedFrames=0;}
   return continued;
  },
  async replayMenu(host:Omit<NativeReplayMenuHost,'memory'|'initialize'|'continueDriving'>):Promise<void>{
   if(!recording)throw Error('No native replay is active');
   await runNativeReplayMenu({...host,memory:()=>state.memory,
    initialize:mode=>{state=readRecordedTwoCarRace(initialize(state.memory,mode),d);},
    continueDriving:restart=>this.continueReplay(restart,host),
   },d);
   state=readRecordedTwoCarRace(state.memory,d);
  },
  /** Join the verified controller to this session's retained memory. Browser
   * services own polling, menus, audio and presentation; simulation stays here. */
  async replayControls(host:Omit<NativeReplayControlsHost,'memory'|'raceCommand'|'scrub'|'seekStart'> & Pick<OriginalRaceKeyServices,'selectMouse'|'resetMouse'> & Pick<NativeReplayScrubHost,'counter'|'input'|'waitMessage'>,caller?:{entryStackPointer:number}):Promise<void>{
   if(!recording)throw Error('No native replay is active');
   await runNativeReplayControls({...host,memory:()=>state.memory,
    raceCommand:key=>this.commandAsync(key,host),
    scrub:async direction=>{await this.scrubReplay(direction,host,caller);},
    seekStart:()=>{state=readRecordedTwoCarRace(restoreReplayCheckpoint(state.memory,d,0,initialize).memory,d);},
   },d);
   state=readRecordedTwoCarRace(state.memory,d);
  },
  async scrubReplay(direction:'forward'|'backward',host:Omit<NativeReplayScrubHost,'memory'|'prepareSeek'|'simulate'>,caller?:{entryStackPointer:number}){
   if(!recording)throw Error('No native replay is active');
   replaySeeking=true;
   try{await scrubNativeReplay({...host,memory:()=>state.memory,
    prepareSeek(target){state=readRecordedTwoCarRace(restoreReplayCheckpoint(state.memory,d,target,initialize).memory,d);},
    simulate(incomingSI){
     const [player,opponent]=resources(state.memory,caller?.entryStackPointer,incomingSI);
     const result=stepRecordedTwoCarRace(state,player,opponent);state=result.state;
    },
   },d,direction);}finally{replaySeeking=false;}
   return state;
  },
  reset(){recording=options.replayInputs?initial.slice():undefined;recordedFrames=options.replayInputs?.length??0;state=readRecordedTwoCarRace(initial.slice(),d);return state;},
  seek(target:number){
   if(!recording){
    recordedFrames=new DataView(state.memory.buffer,state.memory.byteOffset,state.memory.byteLength).getUint16(d+0x8fd8,true);
    const entry=state.memory.slice();new DataView(entry.buffer).setUint16(d+0x8fd8,recordedFrames,true);
    recording=enterManualRace(entry,d);
   }
   if(!Number.isInteger(target)||target<0||target>recordedFrames)throw Error('Replay position is outside the recorded drive');
   const m=recording.slice();m[d+0x9aca]=1;m[d+0xa3c2]=2;
   const result=seekRecordedTwoCarRace(readRecordedTwoCarRace(m,d),target,initialize,current=>resources(current.memory,0xfefc));
   state=result.state;return state;
  },
  tick(input:number){
   const m=state.memory,v=new DataView(m.buffer),clock=state.player.driving.race.stats[2];
   let capture:ReturnType<typeof captureOriginalRaceInput>|undefined;
   if(!recording){
    capture=m[d+0xaa77]?{action:'continue-prompt',recorded:false}:captureOriginalRaceInput(m,d,input);
    if(!capture.recorded){state=readRecordedTwoCarRace(m,d);return {state,effects:[],capture};}
    if(v.getUint16(d+0x8c26,true)!==clock)state=readRecordedTwoCarRace(m,d);
   }
   return {...simulateCaptured(),capture};
  },
 };
}
