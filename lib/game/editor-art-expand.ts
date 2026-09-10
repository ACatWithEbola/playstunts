import {unflipEditorArt} from './editor-art-unflip.ts';
/** Original 0x27ec4..0x27f23 expansion to color indices, before palette mapping. */
export function expandEditorArt(bytes:number[]){
 const source=unflipEditorArt(bytes),stride=source[0]+256*source[1],height=source[2]+256*source[3],size=stride*height;
 if(size<=0||size>8000)throw Error('Editor bitmap outside original expansion limits');
 const pixels=new Uint8Array(size*8).fill(source[13]>>4);
 for(let plane=0;plane<4;plane++){
  const mask=source[12+plane]&15;if(!mask)break;
  for(let i=0;i<size;i++)for(let bit=0;bit<8;bit++)if(source[16+plane*size+i]&(128>>bit))pixels[i*8+bit]|=mask;
 }
 return {width:stride*8,height,pixels};
}
