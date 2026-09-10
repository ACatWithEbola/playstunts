import {acquireCachedResource} from './acquire-cached-resource.ts';
import {allocateResourcePages} from './allocate-resource-pages.ts';
export interface NativeRawResourceHost {
 memory():Uint8Array;writeMemory(memory:Uint8Array):void;
 readFile(nameOffset:number,required:boolean):Promise<Uint8Array|null>;
}
/** Original22d33/22d42/22d50 raw-file path. Reuse cached paragraphs before
 * reading; a missing or zero-length optional file returns the null pointer. */
export async function loadNativeRawResource(host:NativeRawResourceHost,d:number,nameOffset:number,required=false,allocationFrame?:{bp:number;di?:number}){
 const cached=acquireCachedResource(host.memory(),d,nameOffset);host.writeMemory(cached.memory);
 if(cached.found)return {offset:0,segment:cached.segment};
 const bytes=await host.readFile(nameOffset,required);
 if(!bytes||bytes.length===0)return null;
 const pages=Math.ceil(bytes.length/16);if(pages>65535)throw Error('Original raw resource exceeds paragraph count');
 const allocated=allocateResourcePages(host.memory(),d,nameOffset,pages,allocationFrame);host.writeMemory(allocated.memory);
 if(allocated.error)throw Error('Original raw resource allocation failed: '+allocated.error);
 const base=allocated.segment*16;if(base+bytes.length>host.memory().length)throw Error('Original raw resource lies outside memory');
 host.memory().set(bytes,base);return {offset:0,segment:allocated.segment};
}
