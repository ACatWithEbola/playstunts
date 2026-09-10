/** Original 254AE..25575 patterned sprite reveal. These tables are the
 * supplied graphics code's bytes at CS4A9A, CS4AA6 and CS4AAA. */
const rows=[11,5,8,2,10,4,7,1,9,3,6,0],skips=[1,3,0,2],steps=[3,1,4,2];
export function drawOriginalTitleRevealPass(before:Uint8Array,rowOffsets:Uint16Array,source:{width:number;height:number;x:number;y:number;pixels:readonly number[]|Uint8Array},pass:number){
 if(before.length!==65536||source.pixels.length!==source.width*source.height)throw Error('Original reveal drawing data is incomplete');
 const output=new Uint8Array(before);
 for(let slot=11;slot>=0;slot--,pass++){
  let rowPhase=pass;
  for(let y=rows[slot];y<source.height;y+=12,rowPhase++){
   const row=(source.y+y)&32767;
   if(row>=rowOffsets.length)throw Error('Original reveal scanline state is missing');
   let x=0,remaining=source.width,phase=rowPhase;
   for(;;phase++){
    const index=phase&3;remaining-=skips[index];if(remaining<=0)break;
    x+=skips[index];output[(rowOffsets[row]+source.x+x)&65535]=source.pixels[y*source.width+x];
    x+=steps[index];remaining-=steps[index];
   }
  }
 }
 return output;
}
