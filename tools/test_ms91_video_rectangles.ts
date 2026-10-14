import assert from 'node:assert/strict';
import {initializeMs91VideoRectangles,commitMs91VideoRectangles} from '../lib/game/ms91-video-rectangles.ts';
for(const active of [0,1,2,65535]){
 const d=0x10000,storage=new Uint8Array(0x21000),memory=storage.subarray(13,13+0x20000),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 for(let i=0;i<memory.length;i++)memory[i]=(i*37+11)&255;
 v.setUint16(d+0x9690,active,true);v.setUint16(d+0xb0da,0xabcd,true);
 const before=memory.slice(),initialized=initializeMs91VideoRectangles(memory,d);
 assert.deepEqual(initialized,{flags:active?8:0,rectanglesAddress:active?d+0x9710:null});
 if(active)for(let i=0;i<15;i++)assert.deepEqual(memory.slice(d+0x9710+i*8,d+0x9718+i*8),before.slice(d+0x339a,d+0x33a2));
 else assert.deepEqual(memory,before);
 const afterInitialize=memory.slice();commitMs91VideoRectangles(memory,d);
 if(active){assert.equal(v.getUint16(d+0x970a,true),0xabcd);assert.deepEqual(memory.slice(d+0xa65e,d+0xa65e+120),before.slice(d+0xa250,d+0xa250+120));}
 else assert.deepEqual(memory,afterInitialize);
 for(let i=0;i<memory.length;i++)if(memory[i]!==before[i])assert.ok(active&&((i>=d+0x9710&&i<d+0x9788)||(i>=d+0x970a&&i<d+0x970c)||(i>=d+0xa65e&&i<d+0xa65e+120)));
}
for(const call of [initializeMs91VideoRectangles,commitMs91VideoRectangles])assert.throws(()=>call(new Uint8Array(100),0),/outside/);
console.log('MS91 working/retained rectangle steps respect flags, byte offsets and write boundaries; disabled mode is unchanged');
