import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
import {originalModelQueueDepth} from './model-queue-order.ts';
import type {Vector} from '../physics/math.ts';
/** Supplied E780..E7DA queue writes. Count is interpreted as a signed byte
 * for addressing, then incremented as a byte; the model cursor wraps a word.
 */
export function enqueueOriginalModelMemory(memory:Uint8Array,d:number,bias:number,tag:number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const address=layout.address,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(p:number)=>v.getInt16(d+(p&65535),true);
 const pointer=v.getUint16(d+address(0xaa44),true),index=memory[d+address(0xa38e)]<<24>>24;
 const position=[0,1,2].map(a=>word(pointer+a*2)) as Vector,matrix=Array.from({length:9},(_,i)=>word(address(0xaa5c)+i*2));
 const depth=originalModelQueueDepth(position,matrix,bias);
 v.setInt16(d+((address(0x9aee)+index*2)&65535),depth,true);memory[d+((address(0xa012)+index)&65535)]=tag;
 v.setInt16(d+((address(0xa42c)+index*2)&65535),index,true);
 memory[d+address(0xa38e)]++;v.setUint16(d+address(0xaa44),pointer+20,true);
 return {index,depth};
}
