import {drawOriginalDisplaySolidPolygon} from './display-solid-polygon.ts';
import {selectOriginalDisplayWindow} from './select-display-window.ts';
import {captureOriginalEgaDisplay} from './ega-display-capture.ts';
import {drawOriginalEgaDisplayLine} from './ega-display-line.ts';
import {drawOriginalDisplayShadowText} from './display-shadow-text.ts';
import {drawOriginalEgaPoint} from './indexed-display-point.ts';
import {fillOriginalEgaDisplayRectangle} from './ega-display-fill.ts';
import {drawOriginalEgaScaledSprite} from './ega-scaled-sprite.ts';
import {copyOriginalEgaDisplayScreen} from './ega-screen-copy.ts';
import {drawOriginalEgaIndexedSprite} from './ega-indexed-sprite.ts';
import {drawOriginalEgaDisplayReveal} from './ega-display-reveal.ts';
import {setOriginalDisplayActiveBounds} from './display-active-bounds.ts';
import type {createEgaPlanarMemory} from './ega-planar-memory.ts';
import {executeOriginalEgaDisplay} from './execute-ega-display.ts';
import {drawOriginalSoftwareEgaRawBitmap} from './ega-display-raw-bitmap.ts';
import {drawOriginalEgaHardwareRawBitmap} from './ega-hardware-raw-bitmap.ts';
import {drawOriginalEgaPackedBitmap} from './ega-display-bitmap.ts';
import {drawOriginalEgaDisplayFont} from './ega-display-font.ts';
import {clearOriginalDisplayWindow} from './clear-display-window.ts';
import {drainOriginalDisplayPrimitives} from './drain-display-primitives.ts';
/** Native EGA drawing backend. The caller owns original window/resource state
 * and presentation timing; each operation obtains current allocator memory. */
export function createOriginalEgaDrawingHost(memory:()=>Uint8Array,d:number,aperture:ReturnType<typeof createEgaPlanarMemory>){
 return {
  bitmap(pointer:{offset:number;segment:number},position?:{x:number;y:number},format:'raw'|'packed'='raw',operation:'copy'|'and'|'or'='copy'){
   const m=memory();if(format==='packed')return executeOriginalEgaDisplay(aperture,drawOriginalEgaPackedBitmap(m,d,pointer.offset,pointer.segment,position,operation));
   const active=m[0x209e0+0x9114]|(m[0x209e0+0x9115]<<8);
   if(active===0xa000)return executeOriginalEgaDisplay(aperture,drawOriginalEgaHardwareRawBitmap(m,d,pointer.offset,pointer.segment,position,operation));
   drawOriginalSoftwareEgaRawBitmap(m,pointer.offset,pointer.segment,position,operation);
  },
  selectWindow(pointer:{offset:number;segment:number}){selectOriginalDisplayWindow(memory(),'ega',pointer.offset,pointer.segment);},
  capture(pointer:{offset:number;segment:number},position?:{x:number;y:number}){captureOriginalEgaDisplay(memory(),pointer.offset,pointer.segment,position,aperture);},
  line(x0:number,y0:number,x1:number,y1:number,colour:number){return executeOriginalEgaDisplay(aperture,drawOriginalEgaDisplayLine(memory(),d,x0,y0,x1,y1,colour));},
  point(x:number,y:number,colour:number){executeOriginalEgaDisplay(aperture,drawOriginalEgaPoint(memory(),d,x,y,colour));},
  rectangle(x:number,y:number,width:number,height:number,colour:number,clipped=true){return executeOriginalEgaDisplay(aperture,fillOriginalEgaDisplayRectangle(memory(),d,x,y,width,height,colour,clipped));},
  xorRectangle(x:number,y:number,width:number,height:number,colour:number,clipped=true){return executeOriginalEgaDisplay(aperture,fillOriginalEgaDisplayRectangle(memory(),d,x,y,width,height,colour,clipped,'xor'));},
  copyScreen(x:number,y:number,width:number,height:number,shift:number){return executeOriginalEgaDisplay(aperture,copyOriginalEgaDisplayScreen(memory(),d,x,y,width,height,shift));},
  scaledSprite(pointer:{offset:number;segment:number},scale:number,position:{x:number;y:number}){return executeOriginalEgaDisplay(aperture,drawOriginalEgaScaledSprite(memory(),d,pointer.offset,pointer.segment,scale,position));},
  indexedSprite(pointer:{offset:number;segment:number},position?:{x:number;y:number}){return executeOriginalEgaDisplay(aperture,drawOriginalEgaIndexedSprite(memory(),d,pointer.offset,pointer.segment,position));},
  reveal(pointer:{offset:number;segment:number},phase:number,reverse=false){return executeOriginalEgaDisplay(aperture,drawOriginalEgaDisplayReveal(memory(),pointer.offset,pointer.segment,phase,reverse));},
  unclippedPackedBitmap(pointer:{offset:number;segment:number},position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy'){return executeOriginalEgaDisplay(aperture,drawOriginalEgaPackedBitmap(memory(),d,pointer.offset,pointer.segment,position,operation,false));},
  unclippedBitmap(pointer:{offset:number;segment:number},position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy'){
   const m=memory(),active=m[0x209e0+0x9114]|(m[0x209e0+0x9115]<<8);
   if(active===0xa000)return executeOriginalEgaDisplay(aperture,drawOriginalEgaHardwareRawBitmap(m,d,pointer.offset,pointer.segment,position,operation,false));
   drawOriginalSoftwareEgaRawBitmap(m,pointer.offset,pointer.segment,position,operation,false);
  },
  bounds(left:number,right:number,top:number,bottom:number){setOriginalDisplayActiveBounds(memory(),'ega',left,right,top,bottom);},
  shadowText(textOffset:number,x:number,y:number,colour:number,shadow:number){return executeOriginalEgaDisplay(aperture,drawOriginalDisplayShadowText(memory(),d,'ega',textOffset,x,y,colour,shadow));},
  text(textOffset:number,x:number,y:number,opaque=true,continueCursor=false){return executeOriginalEgaDisplay(aperture,drawOriginalEgaDisplayFont(memory(),d,textOffset,x,y,opaque,continueCursor));},
  clearWindow(colour:number){return executeOriginalEgaDisplay(aperture,clearOriginalDisplayWindow(memory(),'ega',colour));},
  polygon(points:readonly (readonly number[])[],colour:number,scratch:{leftOffset:number;rightOffset:number}){return executeOriginalEgaDisplay(aperture,drawOriginalDisplaySolidPolygon(memory(),d,'ega',points,colour,scratch));},
  primitives(scratch:{leftOffset:number;rightOffset:number}){drainOriginalDisplayPrimitives(memory(),d,'ega',scratch,program=>executeOriginalEgaDisplay(aperture,program));},
  pixels(width:number,height:number,stride:number,start=0){return aperture.pixels(width,height,stride,start);},
 };
}
