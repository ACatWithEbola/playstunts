import {hasReplayCheckpointCapacity} from './replay-checkpoint-capacity.ts';
import {resolveReplayCadence} from './replay-cadence.ts';
import type {Vector} from '../physics/math.ts';
export function decodeMs91BodyCache(bytes:Uint8Array):Vector[]{
 if(bytes.length!==24)throw Error('Body cache must contain24 bytes');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 return Array.from({length:4},(_,point)=>[0,1,2].map(axis=>view.getInt16(point*6+axis*2,true)) as Vector);
}
export function encodeMs91BodyCache(points:readonly Vector[]):Uint8Array{
 if(points.length!==4)throw Error('Body cache requires four points');
 const bytes=new Uint8Array(24),view=new DataView(bytes.buffer);
 points.forEach((point,index)=>point.forEach((value,axis)=>view.setInt16(index*6+axis*2,value,true)));
 return bytes;
}
/** Original MS91 initialization repeats each car's retained previous position,
 * rather than computing body-height points before the first chassis step. */
export function initialMs91BodyCaches(memory:Uint8Array,d:number):[Uint8Array,Uint8Array]{
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return [0x8c38,0x8cf0].map(base=>{
  const point=[0,1,2].map(axis=>view.getInt32(d+base+12+axis*4,true)>>6) as Vector;
  return encodeMs91BodyCache([point,point,point,point]);
 }) as [Uint8Array,Uint8Array];
}
/** Explicit live-cache tail owned by the modern checkpoint allocation. This
 * avoids assigning unrelated legacy DS bytes to new physics state.
 */
function address(memory:Uint8Array,d:number,rate:10|20){
 if(!hasReplayCheckpointCapacity(memory,d,rate,'mcga','ms-1991'))throw Error('Modern body cache requires a resident full checkpoint bank');
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 return v.getUint16(d+0xa030,true)+v.getUint16(d+0xa032,true)*16+12000/(30*resolveReplayCadence(rate))*1120;
}
export function readMs91BodyCaches(memory:Uint8Array,d:number,rate:10|20):[Uint8Array,Uint8Array]{
 const at=address(memory,d,rate);return [Uint8Array.from(memory.subarray(at,at+24)),Uint8Array.from(memory.subarray(at+24,at+48))];
}
export function writeMs91BodyCaches(before:Uint8Array,d:number,rate:10|20,caches:readonly [Uint8Array,Uint8Array]){
 if(caches.some(c=>c.length!==24))throw Error('Both body caches must contain24 bytes');
 const at=address(before,d,rate),memory=before.slice();memory.set(caches[0],at);memory.set(caches[1],at+24);return memory;
}
