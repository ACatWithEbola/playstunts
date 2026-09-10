import {createOriginalSetupMemory} from './initialize-setup-state.ts';
import {initializeOriginalSetupMenus} from './initialize-setup-menus.ts';
import {loadOriginalSetupConfiguration,getOriginalSetupChoice} from './native-setup-configuration.ts';
/** Reads selections with SETUP's own parser, including its source defaults and
 * retained token-buffer quirks. This does not execute the saved command line. */
export async function readOriginalSetupSelection(initial:Uint8Array,configuration:Uint8Array|null,detectedVideo=4){
 const memory=createOriginalSetupMemory(initial);initializeOriginalSetupMenus(memory);
 await loadOriginalSetupConfiguration(memory,{open:()=>configuration?3:-1,read:(_handle,limit)=>{const bytes=configuration?.slice(0,limit)??new Uint8Array();return {result:bytes.length,bytes};},close:()=>0,detectVideo:()=>detectedVideo,error(code,path){throw Error(`Original SETUP read failed (${code}): ${path}`);}});
 const values=Array.from({length:5},(_,id)=>getOriginalSetupChoice(memory,0x19a,id));
 return {video:values[0],sound:values[1],control:values[2],language:values[3],printer:values[4],soundParameter:getOriginalSetupChoice(memory,0x278,values[1])};
}
