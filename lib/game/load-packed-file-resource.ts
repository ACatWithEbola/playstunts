import {acquireCachedResource} from './acquire-cached-resource.ts';
import {loadAllocatedPackedResource} from './load-allocated-packed-resource.ts';
import type {NativeRawResourceHost} from './load-raw-resource.ts';
/** Original22da0 packed-file path: acquire the cached bank before reading,
 * then preserve the original decoder's staging and final paragraph resize. */
export async function loadNativePackedFileResource(host:NativeRawResourceHost,d:number,nameOffset:number,required=false){
 const cached=acquireCachedResource(host.memory(),d,nameOffset);host.writeMemory(cached.memory);
 if(cached.found)return {offset:0,segment:cached.segment};
 const bytes=await host.readFile(nameOffset,required);if(!bytes||bytes.length===0)return null;
 const loaded=loadAllocatedPackedResource(host.memory(),d,nameOffset,bytes);host.writeMemory(loaded.memory);
 if(loaded.error||!loaded.resource)throw Error('Original packed resource allocation failed: '+loaded.error);
 return {offset:0,segment:loaded.segment};
}
