import {loadVleResource} from './load-vle-resource.ts';
import {decodeOriginalRleResource} from './decode-rle-resource.ts';
/** Native packed-file byte pipeline. Original allocation, paragraph copies
 * and retained staging memory are separate from this decoded-data boundary. */
export function decodeOriginalPackedResource(packed:Uint8Array){
 if(packed.length<4)throw Error('Truncated original packed resource');
 const passes=packed[0]&128?packed[0]&127:1;
 let bytes=packed[0]&128?packed.subarray(4):packed;
 const stages:Uint8Array[]=[];
 for(let pass=0;pass<passes;pass++){
  if(bytes.length<4)throw Error('Truncated original compression stage');
  const size=bytes[1]+bytes[2]*256+bytes[3]*65536;
  if(bytes[0]===2){
   const memory=new Uint8Array((Math.ceil(size/16)+4)*16);
   bytes=loadVleResource(memory,0,bytes).resource;
  }else if(bytes[0]===1){
   const decoded=decodeOriginalRleResource(bytes);
   if(decoded.bytes.length!==decoded.declaredLength)throw Error('RLE declared length requires retained destination bytes');
   bytes=decoded.bytes;
  }else throw Error('Unsupported original compression type');
  stages.push(bytes);
 }
 return {bytes,stages};
}
