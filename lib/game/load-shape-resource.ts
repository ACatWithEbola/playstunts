import {loadOriginalResourceFallback,type NativeGameResourceHost} from './load-game-resource.ts';
import {loadNativeRawResource,type NativeRawResourceHost} from './load-raw-resource.ts';
import {loadNativePackedFileResource} from './load-packed-file-resource.ts';
/** Original FCC8: packed P3S first, then raw 3SH; retry ignores returned choice. */
export function loadNativeShapeResource(host:NativeGameResourceHost,d:number,nameOffset:number,framePointer:number){
 return loadOriginalResourceFallback(host,d,nameOffset,framePointer,[[7,0x9ae],[1,0x9b3]]);
}
/** Join the original shape wrapper to native allocation, cache and decoding. */
export function loadCompleteNativeShapeResource(host:NativeRawResourceHost&{retry():Promise<number>},d:number,nameOffset:number,framePointer:number){
 return loadNativeShapeResource({memory:()=>host.memory(),retry:()=>host.retry(),load:(kind,name)=>kind===1?loadNativeRawResource(host,d,name,false):loadNativePackedFileResource(host,d,name,false)},d,nameOffset,framePointer);
}
