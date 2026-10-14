import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {fixtureData} from './global-score-fixture.ts';
import {allocateOriginalRenderQueue} from '../lib/game/allocate-render-queue.ts';
import {allocateOriginalGameBuffers} from '../lib/game/allocate-game-buffers.ts';
import {loadNativeOpponentPreparation} from '../lib/game/load-opponent-preparation.ts';
const [path]=process.argv.slice(2);if(!path)throw Error('Provide the captured original opponent preparation fixture');
const source=readFileSync(path),f=JSON.parse(source.toString()),d=0x2d1a0,c=0x209e0;
assert.equal(f.rows.length,24);
for(const row of f.rows){
 let memory:Uint8Array=new Uint8Array(0x100000);memory.set(Buffer.from(f.initial,'hex'),d);memory.set(Buffer.from(f.graphics,'hex'),c+0x5d94);
 for(let i=0x40000;i<0xa0000;i++)memory[i]=i&1?0xa5:0x5a;
 memory=allocateOriginalRenderQueue(memory,d).memory;memory=allocateOriginalGameBuffers(memory,d,0xeefe).memory;
 const v=new DataView(memory.buffer),pointer=(at:number)=>v.getUint16(d+at,true)+v.getUint16(d+at+2,true)*16;
 for(const [at,words] of [[0x73d2,row.primary],[0x7f9a,row.secondary]] as const)words.forEach((value:number,i:number)=>v.setUint16(pointer(at)+i*2,value,true));
 memory.set(row.tiles,pointer(0x8fee));memory[d+0x8fc8]=row.opponent;
 const events:unknown[][]=[];
 await loadNativeOpponentPreparation({memory:()=>memory,writeMemory(next){memory=next;},async readFile(at){
  let name='';for(let i=0;i<65536;i++){const byte=memory[d+((at+i)&65535)];if(!byte)break;name+=String.fromCharCode(byte);}
  events.push(['read',name,at]);return fixtureData.catalog.read(name.toUpperCase());
 },async retry(){throw Error('Unexpected retry');}},d,0xeefe,'mcga','ms-1990');
 assert.deepEqual(events,row.events);
 const expected=Buffer.from(row.data,'hex'),actual=memory.slice(d,d+expected.length);
 for(let at=0x6d00;at<0x7180;at+=18){const end=expected.subarray(at,at+12).indexOf(0);if(end>=0){expected.fill(0,at+end+1,at+12);actual.fill(0,at+end+1,at+12);}}
 assert.deepEqual(actual.subarray(0,Math.min(expected.length,row.stackLow)),new Uint8Array(expected.subarray(0,Math.min(expected.length,row.stackLow))),'Original retained data, opponent '+row.opponent);
 assert.equal(createHash('sha256').update(memory.subarray(0x40000,0xa0000)).digest('hex'),row.heap,'Original complete allocation heap');
}
assert.deepEqual(readFileSync(path),source);
console.log('Current legacy loader matches all 24 captured original opponent preparations, including retained data and complete heaps; fixture unchanged');
