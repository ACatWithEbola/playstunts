import assert from 'node:assert/strict';
import {createAllocatedRaceAudio} from '../lib/game/allocated-race-audio.ts';
import {createAllocatedTandyRaceAudio} from '../lib/game/allocated-tandy-race-audio.ts';
import {createAllocatedMt32RaceAudio} from '../lib/game/allocated-mt32-race-audio.ts';
import {createAllocatedPcSpeakerRaceAudio} from '../lib/game/allocated-pc-speaker-race-audio.ts';
for(const backend of ['adlib','tandy','mt32','pc-speaker'] as const)for(const effectEngine of ['ms-1990','ms-1991'] as const){
 const memory=new Uint8Array(1<<20),v=new DataView(memory.buffer),d=0x20000,car=d+0x618e;
 memory[car]=1;memory[car+34]=1;memory[d+0x4e05]=1;memory[d+0x9f5a]=127;
 memory[d+0x4e06]=backend==='mt32'?1:0;
 memory[d+0x9fe4]=5; // Retain the legacy PC15 driver independently of core version.
 v.setUint16(car+36,0x100,true);v.setUint16(car+38,0x6000,true);
 v.setUint16(car+72,0x200,true);v.setUint16(car+74,0x6000,true);
 const header=0x60200;memory[header+5]=1;memory[header+6]=1;memory[header+11]=1;
 v.setUint16(header+7,0x100,true);v.setUint16(header+9,0x6000,true);
 v.setUint32(header+12,0x6000fffe,true);
 const audio=backend==='adlib'?createAllocatedRaceAudio(()=>memory,d,0x4000,undefined,effectEngine):backend==='tandy'?createAllocatedTandyRaceAudio(()=>memory,d,0x4000,()=>0,()=>0,undefined,effectEngine):backend==='mt32'?createAllocatedMt32RaceAudio(()=>memory,d,0x4000,undefined,effectEngine):createAllocatedPcSpeakerRaceAudio(()=>memory,d,0x4000,()=>0,undefined,effectEngine);
 const bankBefore=memory.slice(d+0x801e,d+0x801e+24*72);
 audio.impacts(0,0x10,true);
 const slot=v.getUint16(car+20,true);assert.ok(slot>=16&&slot<=23);
 const timer=d+0x801e+slot*72;
 assert.equal(v.getUint32(timer,true),effectEngine==='ms-1991'?0x60000002:0x60010002);
 v.setUint16(d+0x4ddc,1,true);v.setUint32(timer+0x18,2,true);
 memory[car]=0; // This fixture exercises effect callbacks, not an active engine voice.
 audio.tick();assert.equal(v.getUint32(timer+0x18,true),1,'Full allocated effect callback retains extended records and advances wait');
 memory[car]=1;
 for(let i=0;i<24;i++)if(i!==slot)assert.deepEqual(memory.slice(d+0x801e+i*72,d+0x801e+(i+1)*72),bankBefore.slice(i*72,(i+1)*72));
 audio.stopEffect(slot);assert.equal(v.getUint32(timer,true),0);
 audio.impacts(0,0x10,true);assert.equal(v.getUint32(d+0x801e+v.getUint16(car+20,true)*72,true),effectEngine==='ms-1991'?0x60000002:0x60010002,'Repeated read/write operations retain core generation');
}
console.log('PASS all4 allocated sound backends impact/stop/restart operations in both core versions; canonical bank and neighbors preserved; hardware playback not exercised');
