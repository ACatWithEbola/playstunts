import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {freeCompleteNativeRaceResources,freeCompleteNativeRaceResourcesAsync} from '../lib/game/complete-race-resource-cleanup.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL'),source=Buffer.from(bytes),d=0x2d1a0;
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine},{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'CLNWAIT',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 let sync:Uint8Array=runtime.session.state.memory.slice(),asyncMemory:Uint8Array=sync.slice();const synchronous:number[]=[],asynchronous:number[]=[];
 // Explicit active stop records ensure cleanup actually awaits delivery.
 sync[d+0x618e]=asyncMemory[d+0x618e]=1;
 freeCompleteNativeRaceResources({memory:()=>sync,writeMemory:next=>{sync=next;},stopEffect:handle=>{synchronous.push(handle);}},d,0x209e0);
 let entered:()=>void=()=>{},finish:()=>void=()=>{};const reached=new Promise<void>(resolve=>{entered=resolve;});
 const pending=freeCompleteNativeRaceResourcesAsync({memory:()=>asyncMemory,writeMemory:next=>{asyncMemory=next;},async stopEffect(handle){asynchronous.push(handle);if(asynchronous.length===1){entered();await new Promise<void>(resolve=>{finish=resolve;});}}},d,0x209e0);
 await reached;assert.equal(asyncMemory[d+0x618e],1);assert.notDeepEqual(asyncMemory,sync,'Later resources remain live while stop delivery is pending');
 finish();await pending;assert.deepEqual(asynchronous,synchronous);assert.deepEqual(asyncMemory,sync,'Full allocated memory matches existing synchronous cleanup');
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),source);
console.log('Both physics editions retain exact complete allocated cleanup memory/order while awaiting stop delivery; source replay unchanged');
