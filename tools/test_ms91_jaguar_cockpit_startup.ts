import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),configuration=Array.from(bytes.subarray(0,24));configuration.splice(0,4,...Array.from('JAGU',c=>c.charCodeAt(0)));
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine},{configuration,track:Array.from(bytes.subarray(24,0x722)),name:'JAGUQA',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 const m=runtime.session.state.memory,d=0x2d1a0,v=new DataView(m.buffer,m.byteOffset,m.byteLength),pointer=v.getUint16(d+0x5482,true)+v.getUint16(d+0x5484,true)*16;
 assert.deepEqual([v.getUint16(pointer+8,true),v.getUint16(pointer+10,true)],physicsEngine==='ms-1991'?[0,0]:[136,148]);
 runtime.session.skipIntroduction();runtime.renderCockpitWorld();
 const recording=Uint8Array.from(bytes);recording.set(configuration,0);const before=recording.slice();
 let retained=runtime;
 for(const engine of ['ms-1991','ms-1990','ms-1991','ms-1990'] as const){
  const loaded=await loadAllocatedReplay({...fixtureData,physicsEngine:retained.session.physicsEngine},retained,{async selectReplay(){return 1;},async readReplay(){return recording.slice();},replayPhysicsEngine:()=>engine,replayFramesPerSecond:()=>20,showWaiting(){},progress(){},writeAudio(){}});
  assert.ok(loaded);retained=loaded;
  const memory=retained.session.state.memory,view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),at=view.getUint16(d+0x5482,true)+view.getUint16(d+0x5484,true)*16;
  assert.deepEqual([view.getUint16(at+8,true),view.getUint16(at+10,true)],engine==='ms-1991'?[0,0]:[136,148],'Retained same-car engine switch');
  retained.session.seek(0);retained.renderCockpitWorld();assert.deepEqual(recording,before);
 }
}
console.log('Actual allocated Jaguar startup uses original version-specific instrument coordinates; both render muted');
