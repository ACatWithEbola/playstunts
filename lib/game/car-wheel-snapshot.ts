import type {Vector} from '../physics/math.ts';
/** Copy the renderer's retained car1 wheel vertices AFTER its native wheel call.
 * Simulation memory alone lacks that renderer's cached steering/retained axes. */
export function readOriginalCarWheelSnapshot(memory:Uint8Array,owner:0|1):Vector[]{
 const d=0x2d1a0,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),descriptor=owner?0x7f58:0x7f42;
 if(v.getUint16(d+descriptor,true)<32)return [];
 const offset=(v.getUint16(d+descriptor+2,true)+48)&65535,base=v.getUint16(d+descriptor+4,true)*16;
 return Array.from({length:24},(_,i)=>[0,1,2].map(axis=>v.getInt16(base+((offset+i*6+axis*2)&65535),true)) as Vector);
}
