import {acquireCachedResource} from './acquire-cached-resource.ts';
import {loadAllocatedVleResource} from './load-allocated-vle-resource.ts';
/** Reuse the original cached bank before staging a fresh packed resource.
 * A hit retains the cached paragraph padding and never re-expands packed data.
 */
export function loadCachedVleBank(before:Uint8Array,dataSegment:number,nameOffset:number,packed:Uint8Array){
 const cached=acquireCachedResource(before,dataSegment,nameOffset);
 if(!cached.found)return loadAllocatedVleResource(cached.memory,dataSegment,nameOffset,packed);
 const base=cached.segment*16;
 if(base+4>cached.memory.length)throw Error('Original cached bank header is outside memory');
 const size=new DataView(cached.memory.buffer).getUint32(base,true);
 if(size<6||base+size>cached.memory.length)throw Error('Original cached bank is outside memory');
 return {...cached,error:null,resource:cached.memory.subarray(base,base+size)};
}
