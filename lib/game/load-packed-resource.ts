import {decodeOriginalPackedResource} from './decode-packed-resource.ts';
import {decodeOriginalRleResource} from './decode-rle-resource.ts';
/** Original22da0 loading inside caller-allocated memory. Preserve packed
 * staging, intermediate paragraph copies and the RLE sequence workspace. */
export function loadPackedResource(before:Uint8Array,allocationBase:number,packed:Uint8Array){
 if(packed.length<4)throw Error('Truncated original packed resource');
 const size=packed[1]+packed[2]*256+packed[3]*65536,resourceParagraphs=Math.ceil(size/16),allocatedParagraphs=resourceParagraphs+4;
 const end=allocationBase+allocatedParagraphs*16;
 if(!size||allocationBase<0||allocationBase%16||end>before.length)throw Error('Original packed allocation is outside memory');
 const memory=before.slice(),stagingAddress=end-Math.ceil(packed.length/16)*16;
 if(stagingAddress<allocationBase)throw Error('Original packed staging exceeds allocation');
 memory.set(packed,stagingAddress);
 const passes=packed[0]&128?packed[0]&127:1;
 let source=stagingAddress+(packed[0]&128?4:0),length=packed.length-(packed[0]&128?4:0);
 for(let pass=0;pass<passes;pass++){
  const bytes=memory.slice(source,source+length);let result:Uint8Array;
  if(bytes[0]===1){
   const decoded=decodeOriginalRleResource(bytes);
   if(decoded.sequence){
    memory.set(decoded.sequence,allocationBase);
    const stagedLength=Math.ceil(decoded.sequence.length/16)*16;
    if(stagedLength>allocatedParagraphs*16)throw Error('Original RLE workspace exceeds allocation');
    memory.copyWithin(end-stagedLength,allocationBase,allocationBase+stagedLength);
   }
   result=decoded.bytes;length=decoded.declaredLength;
  }else if(bytes[0]===2){result=decodeOriginalPackedResource(bytes).bytes;length=result.length;}
  else throw Error('Unsupported original compression type');
  if(result.length>allocatedParagraphs*16)throw Error('Original decompression exceeds allocation');
  memory.set(result,allocationBase);
  if(pass+1<passes){
   const stagedLength=Math.ceil(length/16)*16;source=end-stagedLength;
   if(source<allocationBase)throw Error('Original intermediate stage exceeds allocation');
   memory.copyWithin(source,allocationBase,allocationBase+stagedLength);
  }
 }
 return {memory,resource:memory.subarray(allocationBase,allocationBase+size),stagingAddress,resourceParagraphs,allocatedParagraphs};
}
