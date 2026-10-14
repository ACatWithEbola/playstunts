import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {combineMs91Rectangles} from '../lib/game/ms91-combine-rectangles.ts';
import {prepareMs91PresentationStrip} from '../lib/game/ms91-presentation-strip.ts';
const path=process.argv[2];if(!path)throw Error('Supply original union captures');
const rows=JSON.parse(readFileSync(path,'utf8')) as {first:number;second:number;destination:number;input:string;output:string;alignment:number;mask:number;strip?:{active:number;pointer:number;top:number;bottom:number;scratch:string}}[];assert.equal(rows.length,1000);
for(const row of rows){
 const m=new Uint8Array(65536),v=new DataView(m.buffer);m.set(Buffer.from(row.input,'hex'),0x1000);v.setUint16(0x9ad0,row.alignment,true);v.setUint16(0xa1d8,row.mask,true);
 if(row.strip){const s=row.strip;v.setUint16(0x9690,s.active,true);v.setUint16(0x9a,s.pointer,true);v.setUint16(0xaec6,s.top,true);v.setUint16(0xa1b6,s.bottom,true);prepareMs91PresentationStrip(m,0,0xf000,(first,second,destination)=>combineMs91Rectangles(m,0,first,second,destination));assert.deepEqual(m.slice(0xeff6,0xeffe),Uint8Array.from(Buffer.from(s.scratch,'hex')));}
 else combineMs91Rectangles(m,0,row.first,row.second,row.destination);
 assert.deepEqual(m.slice(0x1000,0x1220),Uint8Array.from(Buffer.from(row.output,'hex')));
}
console.log('All1000 originalMS91 rectangle union/alias/alignment captures match');
