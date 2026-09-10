import {MODEL_DISPLAY_LAYOUTS,type OriginalModelDisplayLayout} from './model-display-layout.ts';
import {i16} from '../physics/math.ts';
import {originalPrimitiveRecordHeader} from './primitive-record-header.ts';
import {enqueueOriginalPrimitiveMemory} from './enqueue-primitive-memory.ts';
/** Joined supplied 1793C..17A03 with the real linked queue routine. */
export function submitOriginalPrimitiveMemory(memory:Uint8Array,d:number,depthSum:number,kind:number,material:number,primitiveFlags:number,beforeDrawCount:number,layout:OriginalModelDisplayLayout=MODEL_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const header=originalPrimitiveRecordHeader(depthSum,memory[d+layout.address(0x900a)],kind,material,memory[d+layout.address(0x9b28)],memory[d+layout.address(0x5f28)],primitiveFlags);
 const offset=v.getUint16(d+layout.address(0x5584),true),segment=v.getUint16(d+layout.address(0x5586),true),address=(n:number)=>(segment*16+((offset+n)&65535))&0xfffff;
 v.setInt16(address(0),header.depth,true);memory[address(2)]=header.material;memory[address(3)]=header.count;memory[address(4)]=header.kind;
 const result=enqueueOriginalPrimitiveMemory(memory,d,header.depth,header.sort,layout);v.setInt16(d+layout.address(0x5588),result,true);
 return {drawCount:i16(beforeDrawCount+1),result,depth:header.depth};
}
