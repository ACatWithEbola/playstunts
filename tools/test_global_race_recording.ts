import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureData,finishedScoreFixture} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {captureGlobalRace} from '../lib/game/global-race-recording.ts';
import {selectOriginalReplayControl} from '../lib/game/replay-control-selection.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
test('observer retains complete controls across original 12000-frame bank slides',async()=>{
 for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const mode of ['tick','program','wait','delivery']){
  const memory=new Uint8Array(2*1024*1024),d=0x2d1a0,v=new DataView(memory.buffer);
  v.setUint16(d+0x9c42,0x1000,true);v.setUint16(d+0xa032,0x5000,true);
  memory[d+0xa34e]=1; // Explicitly accepted long-recording prompt fixture.
  let selected=0;
  const record=()=>captureOriginalRaceInput(memory,d,selected,20,physicsEngine);
  const runtime={session:{physicsEngine,framesPerSecond:20,replaying:false,introducing:false,state:{memory},async continueReplay(){return false;}},tick(){record();return [];},*tickProgram(){yield {kind:'fixture-boundary'};record();return {writes:[],bios:[]};},async tickWithAudioWait(){record();return [];},async tickWithAudioDelivery(){record();return [];}} as unknown as Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;
  const history=captureGlobalRace(runtime),expected=[];
  for(let i=0;i<12650;i++){
   selected=i%16;expected.push(selected);
   const devices={mouse:()=>({x:0,y:0,buttons:0}),joystickSteering:()=>0,controls:()=>selected,keyDown:()=>0};
   if(mode==='program'){const program=runtime.tickProgram(devices);let step=program.next();while(!step.done)step=program.next(0);}
   else if(mode==='wait')await runtime.tickWithAudioWait(devices,async()=>[]);
   else if(mode==='delivery')await runtime.tickWithAudioDelivery(devices,async()=>{});
   else runtime.tick(devices);
  }
  assert.equal(v.getUint16(d+0xa034,true),1200,'Two original600-frame bank slides occurred');
  assert.deepEqual(history.inputs,expected,'Slides must not drop, duplicate or reorder submission inputs');
  assert.equal(history.total,12650);
 }
});
test('all continuation paths record the same complete input history as ordinary ticks in both engines',async()=>{
 const proof=await finishedScoreFixture();
 for(const physicsEngine of ['ms-1990','ms-1991'] as const){
  const histories=[];
  for(const mode of ['tick','program','wait','delivery']){
   const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:{kind:'tandy',driverGeneration:'ms-1990',port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}}, {configuration:proof.replay.slice(0,24),track:proof.replay.slice(24,0x722),name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
   const history=captureGlobalRace(runtime);runtime.session.skipIntroduction();
   for(let i=0;i<2500;i++){
    const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
    if(mode==='program'){const continuation=runtime.tickProgram(devices,true);let step=continuation.next();while(!step.done)step=continuation.next(0);}
    else if(mode==='wait')await runtime.tickWithAudioWait(devices,async()=>[]);
    else if(mode==='delivery')await runtime.tickWithAudioDelivery(devices,async()=>{});
    else runtime.tick(devices);
   }
   assert.ok(history.inputs.length>0,'Continuation must not produce an empty submission replay');
   assert.equal(history.inputs.length,runtime.session.length);
   histories.push(history.inputs.slice());
  }
  for(const history of histories.slice(1))assert.deepEqual(histories[0],history);
 }
});
test('production observer records hardware inputs, blocks continue at replay end, and clears on Restart',async()=>{
 const proof=await finishedScoreFixture(),runtime=await createNativeManualRaceRuntime(fixtureData,{configuration:proof.replay.slice(0,24),track:proof.replay.slice(24,0x722),name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}}),history=captureGlobalRace(runtime);
 const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
 runtime.tick({...devices,controls:()=>0});runtime.session.skipIntroduction();
 for(let i=0;i<100;i++)runtime.tick(devices);
 assert.equal(history.inputs.length,runtime.session.length);assert.ok(history.inputs.every(n=>n===1));
 runtime.session.seek(runtime.session.length);
 const host={resetCounter(){},resetMouse(){},async dialog(){return 1;},selectControl(_mode:number,selected:number){selectOriginalReplayControl(runtime.session.state.memory,0x2d1a0,selected);}};
 await runtime.session.continueReplay(false,host);assert.equal(history.continued,true);assert.equal(runtime.session.state.memory[0x2d1a0+0x8018],1,'Original replay-end continuation may keep flag 1; online eligibility still rejects it');
 runtime.session.seek(runtime.session.length);await runtime.session.continueReplay(true,host);assert.equal(history.continued,false);assert.equal(history.inputs.length,0);
 for(let i=0;i<100;i++)runtime.tick(devices);assert.equal(history.inputs.length,runtime.session.length);
});
