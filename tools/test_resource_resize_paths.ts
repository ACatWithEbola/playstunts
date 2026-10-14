import assert from 'node:assert/strict';
import {resizeResourcePages} from '../lib/game/resize-resource-pages.ts';
let cases=0;
for(const pages of [0,1,4,5,16])for(const kind of ['last','interior','missing','space']){
 const memory=new Uint8Array(0x100000),d=0x60000,v=new DataView(memory.buffer),put=(at:number,value:number)=>v.setUint16(d+at,value,true);
 for(const [at,value] of [[0x4b12,0x1000],[0x4b14,0x1036],[0x4b16,0x1100],[0x4b18,0x1100],[0x4788,0x3304]])put(at,value);
 for(let n=0;n<4;n++){put(0x1000+n*18+12,4);put(0x1000+n*18+14,0x3000+n*0x100);put(0x1000+n*18+16,1);}
 const descriptor=kind==='interior'?0x1012:0x1036,source=v.getUint16(d+descriptor+14,true);put(0x110e,kind==='space'?source+4:0x5000);
 const before=memory.slice(),result=resizeResourcePages(memory,d,kind==='missing'?0x7777:source,pages);
 assert.deepEqual(memory,before);assert.equal(result.error,kind==='missing'?'missing':kind==='interior'&&pages>4?'not-last':kind==='space'&&pages>4?'space':null);
 assert.equal(new DataView(result.memory.buffer).getUint16(d+descriptor+12,true),kind==='missing'||kind==='interior'&&pages>4?4:pages);cases++;
}
console.log(`PASS: ${cases} native resize cases match original outcomes; input memory preserved`);
