import type {CockpitFrameHost} from './cockpit-frame.ts';
import {selectOriginalSpriteWindow,restoreOriginalVideoWindow} from './select-sprite-window.ts';
import {drawOriginalPackedBitmap} from './draw-packed-bitmap.ts';
import {drawOriginalUnclippedPackedBitmap,drawOriginalRawBitmap,saveOriginalBitmapBackground,type OriginalBitmapOperation} from './cockpit-bitmap-raster.ts';
import {rasterOriginalLine} from './raster-original-line.ts';
/** Concrete cockpit raster services over the original allocated bitmap banks.
 * Mouse visibility and alternate-screen allocation belong to the outer host. */
export function createOriginalCockpitRasterHost(memory:()=>Uint8Array,services:Pick<CockpitFrameHost,'selectBackBuffer'|'selectFrontBuffer'|'selectDirectScreen'>,cs=0x209e0):CockpitFrameHost{
 const word=(base:number,at:number)=>{const m=memory();return new DataView(m.buffer,m.byteOffset,m.byteLength).getUint16(base+(at&65535),true);};
 const authored=(off:number,seg:number)=>[word((seg&65535)*16,off+8),word((seg&65535)*16,off+10)] as const;
 const anchored=(off:number,seg:number,x:number,y:number,operation:OriginalBitmapOperation)=>drawOriginalRawBitmap(memory(),off,seg,x-word((seg&65535)*16,off+4),y-word((seg&65535)*16,off+6),operation,cs);
 return {memory,...services,
  selectWindow:(off,seg)=>selectOriginalSpriteWindow(memory(),off,seg,cs),
  restoreVideoWindow:()=>restoreOriginalVideoWindow(memory(),cs),
  clip(left,right,top,bottom){const m=memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength);for(const [at,value] of [[0x5dae,left],[0x5da0,left],[0x5db0,right],[0x5da2,right],[0x5da4,top],[0x5da6,bottom]])v.setUint16(cs+at,value&65535,true);},
  drawPacked:(off,seg,x,y)=>drawOriginalPackedBitmap(memory(),off,seg,x,y,cs),
  drawPackedDefault:(off,seg)=>drawOriginalPackedBitmap(memory(),off,seg,...authored(off,seg),cs),
  drawPackedUnclipped:(off,seg,x,y)=>drawOriginalUnclippedPackedBitmap(memory(),off,seg,x,y,'copy',cs),
  andDefault:(off,seg)=>drawOriginalUnclippedPackedBitmap(memory(),off,seg,...authored(off,seg),'and',cs),
  orDefault:(off,seg)=>drawOriginalUnclippedPackedBitmap(memory(),off,seg,...authored(off,seg),'or',cs),
  andAnchored:(off,seg,x,y)=>anchored(off,seg,x,y,'and'),orAnchored:(off,seg,x,y)=>anchored(off,seg,x,y,'or'),
  orClipped:(off,seg,x,y)=>drawOriginalRawBitmap(memory(),off,seg,x,y,'or',cs),
  copyBitmap:(off,seg,x,y)=>drawOriginalRawBitmap(memory(),off,seg,x,y,'copy',cs),
  saveBackground:(off,seg,x,y)=>saveOriginalBitmapBackground(memory(),off,seg,x,y,cs),
  line(x0,y0,x1,y1,color){const rectangle=[0x5da0,0x5da2,0x5da4,0x5da6].map(at=>word(cs,at)),m=memory(),base=word(cs,0x5d96)*16,rows=word(cs,0x5d9e);for(const [x,y,value] of rasterOriginalLine(x0,y0,x1,y1,color,rectangle))m[base+((word(cs,rows+y*2)+x)&65535)]=value;},
 };
}
