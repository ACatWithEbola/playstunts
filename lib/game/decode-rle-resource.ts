/** Original22b1c RLE byte decoding. Allocation and intermediate staging are
 * caller-owned; declared length is returned separately from expanded bytes. */
export function decodeOriginalRleResource(packed:Uint8Array){
 const u24=(at:number)=>packed[at]+packed[at+1]*256+packed[at+2]*65536;
 if(packed.length<10||packed[0]!==1)throw Error('Expected an original RLE resource');
 const declaredLength=u24(1),sourceLength=u24(4),flags=packed[8],count=flags&127;
 if(count<1||count>11||9+count+sourceLength>packed.length)throw Error('Unsupported or truncated original RLE escape table');
 const escapes=packed.subarray(9,9+count);let stream:Uint8Array=packed.subarray(9+count,9+count+sourceLength);
 if(flags<=128){
  if(count===1)throw Error('Sequence decoding with one escape requires retained original register state');
  const sequence:number[]=[];
  for(let at=0;at<stream.length;){
   const value=stream[at++];if(value!==escapes[1]){sequence.push(value);continue;}
   const begin=at;while(at<stream.length&&stream[at]!==value)at++;
   if(at+1>=stream.length)throw Error('Truncated original repeated sequence');
   const repeat=stream[++at],pattern=stream.subarray(begin,at-1);at++;
   // The original copy loop executes before decrementing its byte counter.
   const copies=repeat===0?256:repeat===1?257:repeat;
   for(let i=0;i<copies;i++)for(const byte of pattern)sequence.push(byte);
  }
  stream=Uint8Array.from(sequence);
 }
 const lookup=new Uint8Array(256);escapes.forEach((value,index)=>{lookup[value]=index+1;});
 const output:number[]=[];
 for(let at=0;at<stream.length;){
  const value=stream[at++],escape=lookup[value];if(!escape){output.push(value);continue;}
  let repeat=escape-1;
  if(escape===1){if(at>=stream.length)throw Error('Truncated original short run');repeat=stream[at++];}
  else if(escape===3){if(at+1>=stream.length)throw Error('Truncated original long run');repeat=stream[at]+stream[at+1]*256;at+=2;}
  if(at>=stream.length)throw Error('Missing original run value');const byte=stream[at++];
  for(let i=0;i<repeat;i++)output.push(byte);
 }
 return {declaredLength,bytes:Uint8Array.from(output),sequence:flags<=128?stream:undefined};
}
