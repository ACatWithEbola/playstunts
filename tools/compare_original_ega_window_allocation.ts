import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalDisplayWindow,originalDisplayWindowAllocation} from '../lib/game/create-display-window.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,36);
for(const row of rows){
 const memory=new Uint8Array(0x100000).fill(0xa5),v=new DataView(memory.buffer),offset=0x9a42,size=(row.height+15)*2;
 v.setUint16(0x209e0+0x9a40,offset,true);memory.fill(0x7d,0x209e0+offset,0x209e0+offset+size);
 const result=createOriginalDisplayWindow(memory,'ega',row.width,row.height,0x7000,row.mask);
 assert.equal(result.error,null);assert.equal(originalDisplayWindowAllocation('ega',row.width,row.height,row.mask).pages,row.pages);
 assert.equal(Buffer.from(memory.slice(0x70000,0x70010)).toString('hex'),row.bitmapHeader);
 const descriptor=memory.slice(0x209e0+offset,0x209e0+offset+size),out=new DataView(descriptor.buffer);out.setUint16(10,(out.getUint16(10,true)-offset)&65535,true);
 assert.equal(Buffer.from(descriptor).toString('hex'),row.descriptor);
}
console.log('PASS: 36 native EGA window headers and complete descriptors match both original editions');
