import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createPc15InterruptAudioStream} from '../lib/game/pc15-interrupt-audio-stream.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:{kind:'pc-speaker',port61:()=>0,sampleIo:{interruptMask:()=>0xa5}}},{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'PCIRQ',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 assert.ok('interrupt' in runtime.audio&&typeof runtime.audio.interrupt==='function');
 const interrupt=runtime.audio.interrupt as ()=>number[][];
 const memory=runtime.session.state.memory,d=0x2d1a0,view=new DataView(memory.buffer),handle=view.getUint16(d+0x8016,true);
 const requested=[...runtime.audio.start(handle),...runtime.audio.crash(handle)];
 let callbacks=0,sampleStarts=0;
 const stream=createPc15InterruptAudioStream({interrupt(){callbacks++;const writes=interrupt();sampleStarts+=writes.filter(([port,value]:number[])=>port===0x43&&value===0xb2).length;return writes;}},[...runtime.initialWrites,...requested],44100);
 const pcm=stream.render(88200);
 assert.ok(callbacks>=190);assert.ok(pcm.every(Number.isFinite));
 console.log(physicsEngine,JSON.stringify({callbacks,sampleStarts,finalSampleFlag:memory[view.getUint16(d+0x4dde,true)*16+0x1a8]}));
 assert.equal(memory[d+0x4e6a],0,'Callback guard must be released');
 const voice=memory.slice(d+0xa036,d+0xa036+46);memory[d+0xa036]=1;memory[d+0xa037]=1;
 assert.throws(()=>runtime.audio.tick(),/Music-owned voice timing/);
 assert.equal(memory[d+0x4e6a],0,'Failed callback must not permanently lock audio');memory.set(voice,d+0xa036);
 runtime.renderCockpitWorld();
}
console.log('Allocated PC15 opt-in renders two seconds of actual engine/crash callbacks in both generations, silent and guard-balanced');
