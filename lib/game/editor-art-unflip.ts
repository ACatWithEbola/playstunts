/** Original PES plane rearrangement 0x27fa7..0x27fee. Retains header and footer. */
export function unflipEditorArt(bytes:number[]):Uint8Array{
 const output=Uint8Array.from(bytes),width=bytes[0]+256*bytes[1],height=bytes[2]+256*bytes[3],size=width*height,mask=bytes[14]>>4;
 if(bytes[15]&240)return output;
 for(let plane=0;plane<4;plane++)if(mask&(1<<plane)){
  const offset=16+plane*size;
  if(offset+size>bytes.length)throw Error('Editor artwork plane exceeds resource bounds');
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)output[offset+y*width+x]=bytes[offset+x*height+y];
 }
 return output;
}
