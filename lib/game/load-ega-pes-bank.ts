import {loadAllocatedPackedResource} from './load-allocated-packed-resource.ts';
import {allocateResourcePages} from './allocate-resource-pages.ts';
import {releaseResourcePages} from './release-resource-pages.ts';
import {unflipOriginalEgaBitmapBank} from './unflip-ega-bitmap-bank.ts';
/** Original3112C PES branch: packed load, fixed1F6-paragraph scratch,
 * flagged planar transpose and scratch release. */
export function loadNativeEgaPesBank(before:Uint8Array,d:number,nameOffset:number,bytes:Uint8Array){
 const loaded=loadAllocatedPackedResource(before,d,nameOffset,bytes);if(loaded.error||!loaded.resource)return loaded;
 const scratch=allocateResourcePages(loaded.memory,d,0x5387,0x1f6);if(scratch.error)return {...loaded,memory:scratch.memory,error:scratch.error,resource:null};
 unflipOriginalEgaBitmapBank(scratch.memory,loaded.segment,scratch.segment);const released=releaseResourcePages(scratch.memory,d,scratch.segment);if(released.error)return {...loaded,...released,resource:null};
 return {...loaded,memory:released.memory,resource:released.memory.subarray(loaded.segment*16,loaded.segment*16+loaded.resource.length)};
}
