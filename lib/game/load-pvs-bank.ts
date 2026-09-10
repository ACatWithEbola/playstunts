import {loadAllocatedPackedResource} from './load-allocated-packed-resource.ts';
import {allocateResourcePages} from './allocate-resource-pages.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {unflipOriginalBitmapBank} from './unflip-bitmap-bank.ts';
/** Original PVS branch after filename/cache selection. The two name pointers
 * retain the caller's 12-byte allocator names, including bytes after NUL. */
export function loadNativePvsBank(before:Uint8Array,d:number,nameOffset:number,scratchNameOffset:number,packed:Uint8Array){
 const loaded=loadAllocatedPackedResource(before,d,nameOffset,packed);
 if(loaded.error||!loaded.resource)return loaded;
 const base=loaded.segment*16,view=new DataView(loaded.memory.buffer),count=view.getInt16(base+4,true);let pages=0;
 // Original2caf0 rounds after a truncated word product plus32.
 for(let index=0;index<count;index++){
  const shape=base+count*8+6+view.getUint32(base+6+count*4+index*4,true);
  pages=Math.max(pages,((view.getUint16(shape,true)*view.getUint16(shape+2,true)+32)&65535)>>>4);
 }
 const scratch=allocateResourcePages(loaded.memory,d,scratchNameOffset,pages);
 if(scratch.error)return {...loaded,memory:scratch.memory,error:scratch.error,resource:null};
 const memory=scratch.memory;
 const conversionStatus=unflipOriginalBitmapBank(memory.subarray(base),memory.subarray(scratch.segment*16,scratch.segment*16+65536));
 const released=releaseResourcePages(memory,d,scratch.segment);
 if(released.error)return {...loaded,...released,resource:null};
 return {...loaded,memory:released.memory,resource:released.memory.subarray(base,base+loaded.resource.length),conversionStatus};
}
