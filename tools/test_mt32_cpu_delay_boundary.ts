import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeOriginalMt32} from '../lib/game/mt32-system-exclusive.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
for(const generation of ['ms-1990','ms-1991'] as const)for(const cancel of [false,true]){
 const original=versionedMt15Resource(generation)??Uint8Array.from(JSON.parse(readFileSync('public/game/mt32-music-titl-seed.json','utf8')).driver);
 const loop=Buffer.from(original).indexOf(Buffer.from([0xba,0,0,0x4a,0x75,0xfd]));assert.ok(loop>=0,'Original driver contains MOV DX,0 / DEC DX / JNZ');
 const driver=original.slice();let cancelled=false,release:()=>void=()=>{},entered:()=>void=()=>{};
 const reached=new Promise<void>(resolve=>{entered=resolve;}),writes:number[][]=[];
 const work=executeTimedMt32Program(initializeOriginalMt32(driver,generation),{
  read:port=>port===0x330?0xfe:0,write:(port,value)=>{writes.push([port,value]);},interrupts(){},cancelled:()=>cancelled,
  async delay(kind,iterations){assert.equal(kind,'decrement-dx');assert.equal(iterations,65536);entered();await new Promise<void>(resolve=>{release=resolve;});},
 });
 const done=cancel?assert.rejects(work,/cancelled/):work;
 await reached;assert.deepEqual(writes,[[0x331,255]],'No UART command or MIDI before delay completion');
 cancelled=cancel;release();await done;
 if(cancel)assert.deepEqual(writes,[[0x331,255]]);else assert.ok(writes.some(([port,value])=>port===0x331&&value===0x3f));
 assert.deepEqual(original,versionedMt15Resource(generation)??Uint8Array.from(JSON.parse(readFileSync('public/game/mt32-music-titl-seed.json','utf8')).driver));
}
console.log('Both original driver loops require65536 iterations; timed startup awaits owning CPU delay and cancellation prevents UART/MIDI delivery; no elapsed-time claim');
