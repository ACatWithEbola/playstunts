import {allocateResourcePages} from './allocate-resource-pages.ts';
import {loadVleResource} from './load-vle-resource.ts';
import {resizeResourcePages} from './resize-resource-pages.ts';
/** Fresh packed-resource allocation, staging/expansion and release of four
 * temporary paragraphs. Cached-name lookup is a separate caller operation.
 */
export function loadAllocatedVleResource(before:Uint8Array,dataSegment:number,nameOffset:number,packed:Uint8Array){
 if(packed.length<6||packed[0]!==2)throw Error('Expected an original single-pass VLE resource');
 const size=packed[1]+packed[2]*256+packed[3]*65536;
 const allocation=allocateResourcePages(before,dataSegment,nameOffset,Math.ceil(size/16)+4);
 if(allocation.error)return {...allocation,resource:null};
 const loaded=loadVleResource(allocation.memory,allocation.segment*16,packed);
 const resized=resizeResourcePages(loaded.memory,dataSegment,allocation.segment,loaded.resourceParagraphs);
 if(resized.error)return {...allocation,...resized,resource:null};
 return {...allocation,...loaded,memory:resized.memory,resource:resized.memory.subarray(allocation.segment*16,allocation.segment*16+size),error:null};
}
