import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeDemoRuntime} from '../lib/game/native-demo-runtime.ts';
import {advanceOriginalHardwareClock} from '../lib/game/hardware-clock-memory.ts';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
const source=readFileSync('public/game/replays/CTKFIN.RPL'),before=Buffer.from(source),d=0x2d1a0;
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const create=()=>createNativeDemoRuntime({...fixtureData,physicsEngine,demoReplay:versionedDemoResource(physicsEngine),experimental10Hz:true},{configuration:Array.from(source.subarray(0,24)),track:Array.from(source.subarray(24,0x722)),name:'DEMOASY',camera:0,graphics:2,soundEnabled:true});
 const expected=await create(),actual=await create();
 const host=(runtime:typeof actual)=>({async gameCounter(){advanceOriginalHardwareClock(runtime.session.state.memory,d);return new DataView(runtime.session.state.memory.buffer).getUint32(d+0x407a,true);},async releaseInput(){},showWaiting(){},copyBackBuffer(){},resetMouse(){},writeAudio(_writes:number[][]){}});
 const syncResult=await expected.finish(host(expected));
 let entered:()=>void=()=>{},release:()=>void=()=>{},calls=0,done=false;
 const reached=new Promise<void>(resolve=>{entered=resolve;});
 const result=actual.finish({...host(actual),async writeAudio(){if(++calls===1){entered();await new Promise<void>(resolve=>{release=resolve;});}}}).then(value=>{done=true;return value;});
 await reached;assert.equal(done,false);release();const restored=await result;
 assert.deepEqual(restored,syncResult);assert.deepEqual(actual.session.state.memory,expected.session.state.memory);
 const failed=await create();await assert.rejects(failed.finish({...host(failed),async writeAudio(){throw Error('Demo sound stop failed');}}),/Demo sound stop failed/);
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),before);
console.log('Both native demo editions await stop writes before menu restoration, retain exact synchronous result/memory and reject failed shutdown');
