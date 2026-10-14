import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resetRaceSession} from '../lib/game/reset-race-session.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,8);
let adaptations=0;
for(const row of rows){
 const memory=new Uint8Array(0x100000),d=0x20000,bank=0x80000,v=new DataView(memory.buffer);
 memory.fill(0xa5,bank,bank+40*1120);
 for(const [at,value] of [[0xa030,0],[0xa032,0x8000],[0xa034,777],[0x73b2,55],[0x93dc,999]])v.setUint16(d+at,value,true);
 for(const at of [0x90a0,0x9b43,0x8ff4,0x7fee])memory[d+at]=7;
 const before=memory.slice(),actual=resetRaceSession(memory,d,row.mode,row.rate,'ms-1991'),av=new DataView(actual.buffer);
 const after={count:av.getUint16(d+0x73b2,true),radius:av.getUint16(d+0x93dc,true),elapsed:av.getUint16(d+0xa034,true),countdown:actual[d+0x90a0],toggle:actual[d+0x9b43],done:actual[d+0x8ff4],phase:actual[d+0x7fee]};
 assert.deepEqual(after,row.after);assert.equal(row.checkpointInterval,30*row.rate);assert.equal(row.timerInterval,100/row.rate);
 const markers=Array.from({length:40},(_,slot)=>actual[bank+slot*1120+0x3f4]);
 assert.deepEqual(markers.slice(0,20),row.markers.slice(0,20));
 if(row.rate===10&&row.mode===-1){assert.deepEqual(markers.slice(20),Array(20).fill(0));adaptations++;}
 else assert.deepEqual(markers,row.markers);
 assert.deepEqual(memory,before);
}
console.log(JSON.stringify({originalPrefixCases:8,coreResetFieldsMatch:true,experimental10HzExtraMarkersCleared:adaptations,exactOriginalMarkerParityAt20Hz:true,pass:true}));
