import {cockpitDigitalDigits} from './cockpit-digital-digits.ts';
import type {CockpitPanelLayer} from './cockpit-panel.ts';
/** Original digital glyph OR draws, clipped to the instrument sprite. These
 * calls use explicit gauge-point positions, not the glyph's stored anchors.
 */
export function drawCockpitDigitalPanel(before:Uint8Array,width:number,height:number,speed:number,points:readonly (readonly number[])[],digits:readonly CockpitPanelLayer[],leading:boolean){
 if(before.length!==width*height)throw Error('Invalid original digital panel size');
 const output=before.slice();
 for(const {digit,x,y} of cockpitDigitalDigits(speed,points,leading)){
  const glyph=digits[digit];if(!glyph)throw Error('Missing original digital glyph');
  for(let row=0;row<glyph.height;row++)for(let column=0;column<glyph.width;column++){
   const px=x+column,py=y+row;
   if(px>=0&&px<width&&py>=0&&py<height)output[py*width+px]|=glyph.pixels[row*glyph.width+column];
  }
 }
 return output;
}
