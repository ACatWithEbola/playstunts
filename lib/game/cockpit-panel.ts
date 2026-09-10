export interface CockpitPanelLayer {x:number;y:number;width:number;height:number;pixels:number[]}
/** Original instrument panel mask (0x25936) followed by OR art (0x2612a).
 * Pixels are palette indices, not RGB values or alpha compositing.
 */
export function composeCockpitPanel(before:Uint8Array,width:number,height:number,mask:CockpitPanelLayer,art:CockpitPanelLayer,clip=false){
 if(before.length!==width*height)throw Error('Invalid cockpit panel size');
 const output=before.slice();
 for(const [layer,operation] of [[mask,'and'],[art,'or']] as const){
  if(layer.pixels.length!==layer.width*layer.height||(!clip&&(layer.x<0||layer.y<0||layer.x+layer.width>width||layer.y+layer.height>height)))throw Error('Cockpit layer outside panel');
  for(let y=0;y<layer.height;y++)for(let x=0;x<layer.width;x++){
   const px=x+layer.x,py=y+layer.y;
   if(clip&&(px<0||py<0||px>=width||py>=height))continue;
   const at=py*width+px,pixel=layer.pixels[y*layer.width+x];
   output[at]=operation==='and'?output[at]&pixel:output[at]|pixel;
  }
 }
 return output;
}

/** Original 0x25936 / 0x2612a do not clip. The caller supplies a segment and
 * scanline offsets; out-of-panel coordinates can address retained row entries.
 * Preserve those writes instead of inventing clipping or correcting asset data.
 */
export function composeCockpitPanelMemory(before:Uint8Array,rowOffsets:Uint16Array,mask:CockpitPanelLayer,art:CockpitPanelLayer){
 if(before.length!==65536)throw Error('Original cockpit destination requires a complete segment');
 const output=before.slice();
 for(const [layer,operation] of [[mask,'and'],[art,'or']] as const){
  if(layer.pixels.length!==layer.width*layer.height)throw Error('Invalid cockpit layer size');
  for(let y=0;y<layer.height;y++){
   const row=(layer.y+y)&0x7fff;
   if(row>=rowOffsets.length)throw Error('Missing original cockpit scanline state');
   for(let x=0;x<layer.width;x++){
    const at=(rowOffsets[row]+layer.x+x)&0xffff,pixel=layer.pixels[y*layer.width+x];
    output[at]=operation==='and'?output[at]&pixel:output[at]|pixel;
   }
  }
 }
 return output;
}
