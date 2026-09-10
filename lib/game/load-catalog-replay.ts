import {loadNativeReplayMemory} from './native-replay-memory-load.ts';
import {buildOriginalFilePath} from './original-file-path.ts';
/** Successful original149C4 file path, using the supplied read-only catalog.
 * Missing-file interaction belongs to the caller's original file service. */
export function loadNativeCatalogReplay(memory:Uint8Array,d:number,catalog:{read(name:string):Promise<Uint8Array|null>},path:number,name:number,framePointer:number){
 return loadNativeReplayMemory(memory,d,{
  buildPath(){buildOriginalFilePath(memory,d,path,name,0x308c,0x937a,(framePointer-0x12)&65535);},
  async read(offset,segment){
   let filename='';for(let i=0;i<65535;i++){const byte=memory[d+((0x937a+i)&65535)];if(!byte)break;filename+=String.fromCharCode(byte);}
   const bytes=await catalog.read(filename);if(!bytes)throw Error('Original replay file is missing: '+filename);
   const address=segment*16+offset;if(address+bytes.length>memory.length)throw Error('Original replay file exceeds its address space');
   memory.set(bytes,address);
  },
 });
}
