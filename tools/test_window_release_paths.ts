import assert from 'node:assert/strict';
import {freeOriginalSpriteWindow} from '../lib/game/free-sprite-window.ts';
let cases=0;
for(const height of [0,1,255,65535])for(const kind of ['valid','wrong-order','missing']){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),put=(at:number,value:number)=>v.setUint16(at,value,true);
 const size=((height+15)*2)&65535,initial=(0x1000+size+Number(kind==='wrong-order'))&65535;
 put(0x209e0+0x9a40,initial);put(0x51000,0);put(0x51002,0x3000);put(0x30002,height);
 put(0x64b12,0x1000);put(0x64b14,0x1012);put(0x61010,1);put(0x61022,1);put(0x61020,kind==='missing'?0x4000:0x3000);
 const before=memory.slice(),result=freeOriginalSpriteWindow(memory,0x60000,0x209e0,0x1000,0x5000,0x9a40),out=new DataView(result.memory.buffer);
 assert.deepEqual(memory,before);
 assert.equal(result.error,kind==='valid'?null:kind==='wrong-order'?'window-order':'missing');
 assert.equal(out.getUint16(0x209e0+0x9a40,true),kind==='wrong-order'?initial:0x1000);
 assert.equal(out.getUint16(0x64b14,true),kind==='valid'?0x1000:0x1012);
 assert.equal(out.getUint16(0x61022,true),kind==='valid'?0:1);cases++;
}
console.log(`PASS: ${cases} native window release fixtures match original outcomes; caller memory preserved`);
