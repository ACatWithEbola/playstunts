import {drawOriginalDisplaySolidPolygon} from './display-solid-polygon.ts';
import {selectOriginalDisplayWindow} from './select-display-window.ts';
import {captureOriginalPackedDisplay} from './packed-display-capture.ts';
import {drawOriginalPackedDisplayLine} from './packed-display-line.ts';
import {drawOriginalDisplayShadowText} from './display-shadow-text.ts';
import {drawOriginalPackedDisplayPoint} from './indexed-display-point.ts';
import {fillOriginalPackedDisplayRectangle} from './packed-display-fill.ts';
import {drawOriginalPackedScaledSprite} from './packed-scaled-sprite.ts';
import {copyOriginalPackedDisplayScreen} from './packed-screen-copy.ts';
import {drawOriginalPackedIndexedSprite} from './packed-indexed-sprite.ts';
import {drawOriginalPackedDisplayReveal} from './packed-display-reveal.ts';
import {setOriginalDisplayActiveBounds} from './display-active-bounds.ts';
import {drawOriginalPackedDisplayUnclippedBitmap} from './packed-display-unclipped-bitmap.ts';
import {drawOriginalPackedDisplayRawBitmap} from './packed-display-raw-bitmap.ts';
import {drawOriginalPackedDisplayBitmap,maskOriginalPackedDisplayBitmap,drawOriginalUnclippedPackedDisplayBitmap} from './packed-display-bitmap.ts';
import {drawOriginalPackedDisplayFont} from './packed-display-font.ts';
import {clearOriginalDisplayWindow} from './clear-display-window.ts';
import {drainOriginalDisplayPrimitives} from './drain-display-primitives.ts';
import {originalPackedDisplayPixels} from './packed-display-pixels.ts';
import type {OriginalDisplayClearOperation} from './clear-display.ts';
/** Native packed-pixel driver backend. Current window/resource memory comes
 * from the allocator owner; CGA/Tandy drawing does not request EGA I/O. */
export function createOriginalPackedDisplayDrawingHost(memory:()=>Uint8Array,d:number,mode:'cga'|'tandy'){
 const finish=<T>(program:Generator<OriginalDisplayClearOperation,T,number>):T=>{const step=program.next();if(!step.done)throw Error('Packed display routine requested unexpected hardware I/O');return step.value;};
 return {
  bitmap(pointer:{offset:number;segment:number},position?:{x:number;y:number},format:'raw'|'packed'='raw',operation:'copy'|'and'|'or'='copy'){
   const m=memory();if(format==='raw')drawOriginalPackedDisplayRawBitmap(m,mode,pointer.offset,pointer.segment,position,operation);
   else if(operation==='copy')drawOriginalPackedDisplayBitmap(m,mode,pointer.offset,pointer.segment,position);
   else maskOriginalPackedDisplayBitmap(m,mode,pointer.offset,pointer.segment,operation);
  },
  selectWindow(pointer:{offset:number;segment:number}){selectOriginalDisplayWindow(memory(),mode,pointer.offset,pointer.segment);},
  capture(pointer:{offset:number;segment:number},position?:{x:number;y:number}){captureOriginalPackedDisplay(memory(),mode,pointer.offset,pointer.segment,position);},
  line(x0:number,y0:number,x1:number,y1:number,colour:number){return drawOriginalPackedDisplayLine(memory(),d,mode,x0,y0,x1,y1,colour);},
  point(x:number,y:number,colour:number){drawOriginalPackedDisplayPoint(memory(),d,mode,x,y,colour);},
  rectangle(x:number,y:number,width:number,height:number,colour:number,clipped=true){fillOriginalPackedDisplayRectangle(memory(),d,mode,x,y,width,height,colour,clipped);},
  xorRectangle(x:number,y:number,width:number,height:number,colour:number,clipped=true){fillOriginalPackedDisplayRectangle(memory(),d,mode,x,y,width,height,colour,clipped,'xor');},
  copyScreen(x:number,y:number,width:number,height:number,shift:number){copyOriginalPackedDisplayScreen(memory(),mode,x,y,width,height,shift);},
  scaledSprite(pointer:{offset:number;segment:number},scale:number,position:{x:number;y:number}){drawOriginalPackedScaledSprite(memory(),d,mode,pointer.offset,pointer.segment,scale,position);},
  indexedSprite(pointer:{offset:number;segment:number},position?:{x:number;y:number}){drawOriginalPackedIndexedSprite(memory(),d,mode,pointer.offset,pointer.segment,position);},
  reveal(pointer:{offset:number;segment:number},phase:number,reverse=false){drawOriginalPackedDisplayReveal(memory(),mode,pointer.offset,pointer.segment,phase,reverse);},
  unclippedPackedBitmap(pointer:{offset:number;segment:number},position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy'){drawOriginalUnclippedPackedDisplayBitmap(memory(),mode,pointer.offset,pointer.segment,position,operation);},
  unclippedBitmap(pointer:{offset:number;segment:number},position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy'){drawOriginalPackedDisplayUnclippedBitmap(memory(),mode,pointer.offset,pointer.segment,position,operation);},
  bounds(left:number,right:number,top:number,bottom:number){setOriginalDisplayActiveBounds(memory(),mode,left,right,top,bottom);},
  shadowText(textOffset:number,x:number,y:number,colour:number,shadow:number){return finish(drawOriginalDisplayShadowText(memory(),d,mode,textOffset,x,y,colour,shadow));},
  text(textOffset:number,x:number,y:number,opaque=true,continueCursor=false){drawOriginalPackedDisplayFont(memory(),d,mode,textOffset,x,y,opaque,continueCursor);},
  clearWindow(colour:number){finish(clearOriginalDisplayWindow(memory(),mode,colour));},
  polygon(points:readonly (readonly number[])[],colour:number,scratch:{leftOffset:number;rightOffset:number}){return finish(drawOriginalDisplaySolidPolygon(memory(),d,mode,points,colour,scratch));},
  primitives(scratch:{leftOffset:number;rightOffset:number}){drainOriginalDisplayPrimitives(memory(),d,mode,scratch,finish);},
  pixels(){return originalPackedDisplayPixels(memory(),mode);},
 };
}
