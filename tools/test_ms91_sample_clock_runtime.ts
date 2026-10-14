import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createAudioRuntimeStream} from '../lib/game/player-audio-stream.ts';
import {audioBufferBatch} from '../lib/game/audio-buffer-batch.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');
const menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'CLOCK',camera:0,graphics:2,soundEnabled:false};
const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>2,keyDown:()=>0};
for(const framesPerSecond of [10,20] as const)for(const sampleRate of [44100,48000]){
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine:'ms-1991',framesPerSecond,experimental10Hz:framesPerSecond===10},menu,{resetMouse(){}});runtime.session.skipIntroduction();
 const initial=runtime.session.state.memory.slice(),view=()=>new DataView(runtime.session.state.memory.buffer),frame=()=>view().getUint16(0x2d1a0+0x8c26,true),before=frame();
 let buffer=new Int16Array(0);const stream=createAudioRuntimeStream({initialWrites:runtime.initialWrites,tick:()=>runtime.tick(devices)},{write(){},generate(samples){buffer=new Int16Array(samples*2);},getBuffer:()=>buffer},sampleRate);
 for(let remaining=sampleRate*5;remaining>0;){const count=Math.min(512,remaining);stream.render(count);remaining-=count;}
 assert.ok(Math.abs(frame()-before-5*framesPerSecond)<=1,'Five seconds of audio must advance nominal recorded cadence');
 assert.equal(runtime.session.physicsEngine,'ms-1991');assert.equal(runtime.session.framesPerSecond,framesPerSecond);assert.equal(runtime.session.state.player.driving.car.grip.crash,0);
 assert.notDeepEqual(runtime.session.state.memory,initial,'Clock must actually advance');
 console.log(sampleRate+'Hz silent sample clock: MS91 '+framesPerSecond+'Hz advances '+(frame()-before)+' frames over5 seconds');
}
for(const framesPerSecond of [10,20] as const){
 const outcomes:number[]=[];
 for(const refreshRate of [60,120,240]){
  const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine:'ms-1991',framesPerSecond,experimental10Hz:framesPerSecond===10},menu,{resetMouse(){}});runtime.session.skipIntroduction();
  let buffer=new Int16Array(0),next=0,blocks=0;
  const stream=createAudioRuntimeStream({initialWrites:runtime.initialWrites,tick:()=>runtime.tick(devices)},{write(){},generate(samples){buffer=new Int16Array(samples*2);},getBuffer:()=>buffer},48000);
  for(let raf=0;raf<=refreshRate*5;raf++)next=audioBufferBatch(next,raf/refreshRate,512/48000,()=>{stream.render(512);blocks++;});
  const frame=new DataView(runtime.session.state.memory.buffer).getUint16(0x2d1a0+0x8c26,true);outcomes.push(frame);
  assert.ok(Math.abs(frame-5*framesPerSecond)<=3,'Scheduler lead stays bounded at'+refreshRate+'Hz');
  console.log(refreshRate+'Hz refresh scheduler: MS91 '+framesPerSecond+'Hz advances '+frame+' frames ('+blocks+' audio blocks) over5 seconds plus bounded audio lead');
 }
 assert.ok(Math.max(...outcomes)-Math.min(...outcomes)<=1,'Refresh rates must agree within one simulation frame');
}
