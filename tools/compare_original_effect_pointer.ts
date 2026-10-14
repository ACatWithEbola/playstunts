import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {startEffect} from '../lib/game/effect-start.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.ok(rows.length===336||rows.length===1008);
const effects=rows.filter((row:{owner:number})=>row.owner>=16);
assert.equal(effects.length,336);
for(const row of effects){
 const header=new Uint8Array(12);header[5]=1;new DataView(header.buffer).setUint32(8,row.rawPointer,true);
 const result=startEffect({physicsEngine:row.engine,enabled:true,master:128,volume:43,priority:64,requested:row.owner,
 headerOffset:0x2000,headerSegment:0x6000,header,timers:Array.from({length:24},()=>new Uint8Array(row.engine==='ms-1991'?76:72).fill(0xaa)),
 busy:Array(24).fill(0),lastNotes:new Uint8Array(24),markers:new Uint8Array(24)});
 assert.deepEqual(Array.from(result.timers[row.owner]),row.timer,`${row.engine} slot${row.owner} complete timer record for pointer ${row.rawPointer}`);
}
console.log('PASS336 original/native complete72/76-byte initializer records across all8 effect slots and pointer boundaries');
