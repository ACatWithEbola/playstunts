import {loadNativeGameResource} from './load-game-resource.ts';
import {loadNativeRawResource,type NativeRawResourceHost} from './load-raw-resource.ts';
import {loadNativePackedFileResource} from './load-packed-file-resource.ts';
/** Original RES/PRE wrapper with native cache, allocation and decoding. */
export async function loadCompleteNativeGameResource(host:NativeRawResourceHost&{retry():Promise<number>},d:number,nameOffset:number,framePointer:number){
 return loadNativeGameResource({memory:()=>host.memory(),retry:()=>host.retry(),load:(kind,name)=>kind===1?loadNativeRawResource(host,d,name,false):loadNativePackedFileResource(host,d,name,false)},d,nameOffset,framePointer);
}
