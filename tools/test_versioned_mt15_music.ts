import assert from 'node:assert/strict';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
for(const driverGeneration of [undefined,'ms-1990','ms-1991'] as const){
 const bank=new Uint8Array(64),patch=new Uint8Array(101);bank[6]=1;new DataView(bank.buffer).setUint32(7,0x90000001,true);bank[11]=1;bank.set([0,0xdc,0,1,0xd9],16);patch[1+67]=1;
 const timers=Array.from({length:24},()=>Array(72).fill(0)),t=Uint8Array.from(timers[0]);new DataView(t.buffer).setUint32(0,0x80000010,true);timers[0]=Array.from(t);
 const runtime=createOriginalMt32MusicRuntime({driverGeneration,header:0,bank:Array.from(bank),voices:Array.from(patch),timers,hardware:Array.from({length:16},()=>{const v=Array(46).fill(0);v[0]=255;return v;}),lastNotes:Array(24).fill(0),velocities:[],initialWrites:[],percussion:[],driver:Array(1750).fill(0),nullInstrument:Array(100).fill(0),systemVolume:[0x10,0,0x16,100]});
 const writes:number[][]=[];for(let i=0;i<20;i++)writes.push(...runtime.tick().writes);
 assert.equal(writes.some(([port,value])=>port===0x330&&value===0xf0),driverGeneration==='ms-1991');
 if(driverGeneration==='ms-1991')assert.throws(()=>runtime.control({type:'master-volume',value:0}),/timed transport/);
 else assert.ok(runtime.control({type:'master-volume',value:0}).writes.length);
}
console.log('Roland music forwards driver generation for instrument messages; legacy/default volume unchanged, modern timing cannot silently bypass host');
