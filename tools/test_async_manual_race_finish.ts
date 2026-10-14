import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {advanceOriginalHardwareClock} from '../lib/game/hardware-clock-memory.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),d=0x2d1a0;
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const create=()=>createNativeManualRaceRuntime({...fixtureData,physicsEngine},{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'ASYNCEND',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 const runtime=await create();let entered:()=>void=()=>{},finish:()=>void=()=>{},writes=0;
 const reached=new Promise<void>(resolve=>{entered=resolve;});
 const host={async gameCounter(){advanceOriginalHardwareClock(runtime.session.state.memory,d);return new DataView(runtime.session.state.memory.buffer).getUint32(d+0x407a,true);},async releaseInput(){},showWaiting(){},copyBackBuffer(){},resetMouse(){},opponent:{async show(){},drawTime(){},async key(){return 27;}},async writeAudio(){if(++writes===1){entered();await new Promise<void>(resolve=>{finish=resolve;});}}};
 const closing=runtime.finish(host);await reached;
 assert.throws(()=>runtime.releaseMenuState(),/finish cleanup/,'Pending write cannot mark menu restored');finish();await closing;
 assert.ok(writes>=1);assert.doesNotThrow(()=>runtime.releaseMenuState());
 const broken=await create();
 await assert.rejects(broken.finish({...host,async writeAudio(){throw Error('Audio shutdown failed');}}),/Audio shutdown failed/);
 assert.throws(()=>broken.releaseMenuState(),/finish cleanup/,'Failed write cannot permit incomplete menu restore');
}
console.log('Both manual race editions await real finish audio writer and disallow menu restoration until successful cleanup');
