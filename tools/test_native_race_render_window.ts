import assert from 'node:assert/strict';
import {createOriginalDisplayWindow} from '../lib/game/create-display-window.ts';
import {nativeRaceRenderWindow} from '../lib/game/native-race-render-window.ts';
for(const mode of ['cga','tandy','ega'] as const){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),d=0x32090,high={cga:0x5e0,tandy:0x620,ega:0x45c}[mode],top={cga:0x70c8,tandy:0x6ad6,ega:0x9a40}[mode];
 v.setUint16(0x209e0+top,0x4000,true);const created=createOriginalDisplayWindow(memory,mode,320,200,0x6000);assert.equal(created.error,null);
 v.setUint16(d+0x933a+high,created.offset,true);v.setUint16(d+0x933c+high,created.segment,true);const before=memory.slice();
 assert.deepEqual(nativeRaceRenderWindow(memory,d,mode),{window:{offset:created.offset,segment:created.segment},bitmap:{offset:0,segment:0x6000}});assert.deepEqual(memory,before);
 memory[d+0xaa46+high]=1;assert.throws(()=>nativeRaceRenderWindow(memory,d,mode),/Page flipping/);
}
console.log('Allocated CGA/Tandy/EGA race window descriptors resolve to their backing bitmaps without memory writes');
