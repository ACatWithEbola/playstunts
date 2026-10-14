import assert from 'node:assert/strict';
import {initializeOriginalPcSpeakerMemory} from '../lib/game/initialize-pc-speaker-memory.ts';
import {readOriginalPcSpeakerRaceState} from '../lib/game/pc-speaker-race-audio-memory.ts';
for(const engine of [undefined,'ms-1990','ms-1991'] as const){
 const memory=new Uint8Array(0x100000),d=0x60000,driver=0x8000;
 const result=await initializeOriginalPcSpeakerMemory(memory,d,driver,0,engine);
 assert.equal(result.result,0);
 assert.equal(memory[d+0x9fe4],engine==='ms-1991'?7:5);
 const state=readOriginalPcSpeakerRaceState(memory,d,driver,engine);
 assert.equal(state.voices.length,engine==='ms-1991'?7:5);
 assert.equal(state.physicsEngine,engine);
 assert.ok(result.writes.every(([port])=>[0x43,0x40,0x42,0x61].includes(port)));
}
console.log('PC15 allocated initialization/reset supports explicit five/seven-slot layouts; all output captured, no hardware audio');
