import type {SignCollisionData} from '../physics/sign-contact.ts';
import type {Vector} from '../physics/math.ts';
/** Native runtime retains canonical MCGA memory offsets for both engine versions. */
export function readSignCollisionMemory(memory:Uint8Array,d:number):SignCollisionData{
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const far=(field:number)=>v.getUint16(d+field+2,true)*16+v.getUint16(d+field,true);
 const cells=far(0xa466),points=far(0x70e0),count=memory[d+0x9c47];
 if(count>48||cells+900>memory.length||points+count*6>memory.length)throw Error('Invalid original sign collision allocation');
 return {cells:Array.from(memory.subarray(cells,cells+900)),positions:Array.from({length:count},(_,i)=>[0,1,2].map(axis=>v.getInt16(points+i*6+axis*2,true)) as Vector),broken:Array.from(memory.subarray(d+0x8eb0,d+0x8eb0+count))};
}
