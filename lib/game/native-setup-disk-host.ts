import {createNativeSetupFileHandles} from './native-setup-file-handles.ts';
import type {createNativeSetupStorage} from './native-setup-storage.ts';
/** SETUP's one retained directory search and DOS DTA filename buffer. */
export function createNativeSetupDiskHost(memory:Uint8Array,storage:Awaited<ReturnType<typeof createNativeSetupStorage>>){
 const handles=createNativeSetupFileHandles(storage);let names:string[]=[];
 const found=()=>{const name=names.shift();if(name===undefined)return 0;if(name.length>12)throw Error('Original SETUP directory entries require DOS short names');memory.set(Array.from(name+'\0',c=>c.charCodeAt(0)),0x39c);return 0x39c;};
 return {...handles,findFirst(path:string,attribute:number){names=storage.find(path,attribute);return found();},findNext:found,makeDirectory:storage.makeDirectory,changeDrive:storage.changeDrive,changeDirectory:storage.changeDirectory};
}
