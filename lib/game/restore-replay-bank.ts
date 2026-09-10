import {loadPackedResource} from './load-packed-resource.ts';
import {unflipOriginalBitmapBank} from './unflip-bitmap-bank.ts';
import {packOriginalBitmapBank} from './pack-bitmap-bank.ts';
/** Restore the SDGAME payload omitted from the stripped startup snapshot.
 * This fills its existing resident allocation, without changing heap state.
 * Fresh runtime allocations use loadNativePackedPvsBank instead. */
export function restoreOriginalReplayBank(before:Uint8Array,d:number,packed:Uint8Array){
 const view=new DataView(before.buffer,before.byteOffset,before.byteLength),offset=view.getUint16(d+0xa318,true),segment=view.getUint16(d+0xa31a,true),base=segment*16+offset;
 if(offset!==0)throw Error('The retained replay bank must begin at its allocated paragraph');
 const first=view.getUint16(d+0x4b12,true),last=view.getUint16(d+0x4b14,true);let pages:number|undefined;
 for(let descriptor=last,guard=0;descriptor!==first;descriptor=(descriptor-18)&65535){
  if(guard++>=3641)throw Error('Original resident resource chain is not bounded');
  if(view.getUint16(d+descriptor+14,true)!==segment)continue;
  const name=new TextDecoder().decode(before.subarray(d+descriptor,d+descriptor+12)).split('\0')[0].toLowerCase();
  if(name!=='sdgame'||view.getUint16(d+descriptor+16,true)!==2)throw Error('Retained replay allocation belongs to another resource');
  pages=view.getUint16(d+descriptor+12,true);break;
 }
 if(pages===undefined||base+pages*16>before.length)throw Error('Original resident replay allocation is missing');
 if(view.getUint32(base,true)!==0)return before;
 const decodedLength=packed[1]+packed[2]*256+packed[3]*65536;
 const bank=loadPackedResource(new Uint8Array(Math.max(65536,decodedLength+65536)),0,packed).memory;
 if(unflipOriginalBitmapBank(bank,new Uint8Array(65536)))throw Error('Original replay bitmap conversion failed');
 const destination=new Uint8Array(Math.max(65536,decodedLength+65536));
 const result=packOriginalBitmapBank(bank,destination);
 if(result.paragraphs!==pages)throw Error('Rebuilt replay bank does not match the retained allocation');
 const memory=before.slice();memory.set(destination.subarray(0,result.bytesWritten),base);return memory;
}
