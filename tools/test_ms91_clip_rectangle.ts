import assert from 'node:assert/strict';
import {clipMs91Rectangle} from '../lib/game/ms91-clip-rectangle.ts';
const storage=new Uint8Array(65536+19),memory=storage.subarray(19),v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
function put(p:number,words:number[]){words.forEach((n,i)=>{memory[(p+i*2)&65535]=n&255;memory[(p+i*2+1)&65535]=(n>>8)&255;});}
function get(p:number){return Array.from({length:4},(_,i)=>{const q=(p+i*2)&65535;return (memory[q]|memory[(q+1)&65535]<<8)<<16>>16;});}
for(const [rect,expected,rejected] of [
 [[-10,30,-20,40],[0,20,0,20],false],
 [[2,8,3,9],[2,8,3,9],false],
 [[20,30,0,10],[20,30,0,10],true],
 [[-10,0,0,10],[-10,0,0,10],true],
 [[0,10,20,30],[0,10,20,30],true],
 [[0,10,-10,0],[0,10,-10,0],true],
 [[10,2,0,10],[10,2,0,10],true],
 [[5,5,2,8],[5,5,2,8],false],
] as [number[],number[],boolean][]){
 memory.fill(0x55);put(100,rect);put(200,[0,20,0,20]);const before=memory.slice();
 assert.equal(clipMs91Rectangle(memory,0,100,200),rejected);assert.deepEqual(get(100),expected);
 for(let i=0;i<memory.length;i++)if(i<100||i>=108)assert.equal(memory[i],before[i]);
}
put(65533,[-5,30,-5,30]);put(200,[0,20,0,20]);assert.equal(clipMs91Rectangle(memory,0,65533,200),false);assert.deepEqual(get(65533),[0,20,0,20]);
put(100,[-100,100,-100,100]);assert.equal(clipMs91Rectangle(memory,0,100,100),false);assert.deepEqual(get(100),[-100,100,-100,100]);
assert.throws(()=>clipMs91Rectangle(new Uint8Array(100),0,0,0),/outside/);
assert.throws(()=>clipMs91Rectangle(memory,0,-1,0),/pointer/);
console.log('MS91 rectangle clipping: signed bounds, edge rejection, zero width, pointer wrap, alias and write boundaries passed');
