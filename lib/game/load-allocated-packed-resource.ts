import {allocateResourcePages} from './allocate-resource-pages.ts';
import {loadPackedResource} from './load-packed-resource.ts';
import {resizeResourcePages} from './resize-resource-pages.ts';
/** Original packed-resource allocation and final four-paragraph release.
 * Cached lookup and file selection belong to the enclosing file service. */
export function loadAllocatedPackedResource(before:Uint8Array,d:number,nameOffset:number,packed:Uint8Array){
 if(packed.length<4)throw Error('Truncated original packed resource');
 const size=packed[1]+packed[2]*256+packed[3]*65536;
 const allocation=allocateResourcePages(before,d,nameOffset,Math.ceil(size/16)+4);
 if(allocation.error)return {...allocation,resource:null};
 const loaded=loadPackedResource(allocation.memory,allocation.segment*16,packed);
 const resized=resizeResourcePages(loaded.memory,d,allocation.segment,loaded.resourceParagraphs);
 if(resized.error)return {...allocation,...resized,resource:null};
 return {...allocation,...loaded,memory:resized.memory,resource:resized.memory.subarray(allocation.segment*16,allocation.segment*16+size),error:null};
}
