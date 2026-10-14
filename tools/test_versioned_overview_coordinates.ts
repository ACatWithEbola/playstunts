import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {originalTrackOverviewSubmissions} from '../lib/game/track-overview-submissions.ts';
import {i16} from '../lib/physics/math.ts';
const source=new Uint8Array(readFileSync(new URL('../public/game/native-render-resources.bin',import.meta.url))),d=0x2d1a0;
const memory=source.slice(),view=new DataView(memory.buffer),word=(o:number)=>view.getUint16(d+o,true),signed=(o:number)=>view.getInt16(d+o,true);
const road=word(0x9358)*16+word(0x9356),terrain=word(0x9ad2)*16+word(0x9ad0);
memory.fill(0,road,road+900);memory.fill(0,terrain,terrain+900);memory[road+word(0xa350)]=1;
// A single ordinary road at the first tile isolates its three position fields.
for(const raised of [false,true])for(const camera of [-32767,-3,-1,0,1,3,32767]){
 memory[terrain+word(0x89d4)]=raised?6:0;view.setInt16(d+0x124,512,true);
 for(const offset of [0x8f6,0x8f8,0x8fa])view.setInt16(d+offset,camera,true);
 const before=memory.slice();
 for(const engine of [undefined,'ms-1990','ms-1991']as const){
  const records:number[][]=[];let drains=0;
  originalTrackOverviewSubmissions(memory,d,record=>record?records.push(record):drains++,undefined,undefined,engine);
  const overlay=memory[d+0x2018+14+8];
  assert.equal(drains,900);assert.equal(records.length,1+(raised?1:0)+(overlay&&word(0x2018+overlay*14+6)?1:0));
  const flags=memory[d+0x2018+14+11],x=signed(flags&2?0x7378:0xa3e2),z=signed(flags&1?0x7f9e:0xa796);
  const expected=[x,raised?512:0,z].map(value=>{const delta=i16(value-camera);return engine==='ms-1991'?delta>>1:Math.trunc(delta/2);});
  for(const record of records){
   const recordView=new DataView(Uint8Array.from(record).buffer);
   assert.deepEqual([0,2,4].map(o=>recordView.getInt16(o,true)),expected.map(n=>Object.is(n,-0)?0:n));
  }
  assert.deepEqual(memory,before);
 }
}
console.log(JSON.stringify({coordinateCases:42,terrainCases:2,drainsPerCase:900,legacyDefaultPreserved:true,sourceUnchanged:true}));
