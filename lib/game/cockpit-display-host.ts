import type {CockpitFrameHost} from './cockpit-frame.ts';
interface Pointer {offset:number;segment:number}
interface Position {x:number;y:number}
export interface OriginalCockpitDisplayDrawingHost {
 selectWindow(pointer:Pointer):void;
 bounds(left:number,right:number,top:number,bottom:number):void;
 bitmap(pointer:Pointer,position?:Position,format?:'raw'|'packed',operation?:'copy'|'and'|'or'):void;
 unclippedPackedBitmap(pointer:Pointer,position?:Position,operation?:'copy'|'and'|'or'):void;
 capture(pointer:Pointer,position?:Position):void;
 line(x0:number,y0:number,x1:number,y1:number,colour:number):void;
}
/** Native cockpit drawing over the selected original packed/planar driver.
 * The outer presentation owner selects its front, back and direct screens. */
export function createOriginalCockpitDisplayHost(memory:()=>Uint8Array,d:number,mode:'cga'|'tandy'|'ega',drawing:OriginalCockpitDisplayDrawingHost,services:Pick<CockpitFrameHost,'selectBackBuffer'|'selectFrontBuffer'|'selectDirectScreen'>):CockpitFrameHost {
 const anchored=(offset:number,segment:number,x:number,y:number,operation:'and'|'or')=>{
  const m=memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength),base=(segment&65535)*16;
  drawing.bitmap({offset,segment},{x:x-v.getUint16(base+((offset+4)&65535),true),y:y-v.getUint16(base+((offset+6)&65535),true)},'raw',operation);
 };
 return {memory,...services,
  selectWindow:(offset,segment)=>drawing.selectWindow({offset,segment}),
  // Original1B276 restores the game's fixed video window, including EGA9A42.
  restoreVideoWindow:()=>drawing.selectWindow({offset:mode==='cga'?0x6880:mode==='tandy'?0x63f0:0x9a42,segment:0x209e}),
  clip:(left,right,top,bottom)=>drawing.bounds(left,right,top,bottom),
  drawPacked:(offset,segment,x,y)=>drawing.bitmap({offset,segment},{x,y},'packed'),
  drawPackedDefault:(offset,segment)=>drawing.bitmap({offset,segment},undefined,'packed'),
  drawPackedUnclipped:(offset,segment,x,y)=>drawing.unclippedPackedBitmap({offset,segment},{x,y}),
  andDefault:(offset,segment)=>drawing.unclippedPackedBitmap({offset,segment},undefined,'and'),
  orDefault:(offset,segment)=>drawing.unclippedPackedBitmap({offset,segment},undefined,'or'),
  andAnchored:(offset,segment,x,y)=>anchored(offset,segment,x,y,'and'),
  orAnchored:(offset,segment,x,y)=>anchored(offset,segment,x,y,'or'),
  orClipped:(offset,segment,x,y)=>drawing.bitmap({offset,segment},{x,y},'raw','or'),
  copyBitmap:(offset,segment,x,y)=>drawing.bitmap({offset,segment},{x,y},'raw'),
  saveBackground:(offset,segment,x,y)=>drawing.capture({offset,segment},{x,y}),
  line:(x0,y0,x1,y1,colour)=>drawing.line(x0,y0,x1,y1,colour),
 };
}
