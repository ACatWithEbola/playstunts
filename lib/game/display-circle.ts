import {originalCirclePlan} from './original-circle-plan.ts';
import {originalLargeEllipseContour} from './original-large-ellipse-contour.ts';
import {drawOriginalDisplaySolidPolygon} from './display-solid-polygon.ts';
import {drawOriginalPackedDisplayPoint,drawOriginalEgaPoint} from './indexed-display-point.ts';
import {drawOriginalPackedPolygonSpans} from './packed-polygon-spans.ts';
import {drawOriginalEgaPolygonSpans} from './ega-polygon-spans.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
/** Original alternative display circle dispatch, including small radius tables
 * and the 32-point ellipse fallback. Scratch buffers belong to the caller. */
export function* drawOriginalDisplayCircle(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',x:number,y:number,diameter:number,colour:number,scratch:{leftOffset:number;rightOffset:number}):Generator<OriginalEgaBitmapOperation,void,number>{
 const c=0x209e0,block=mode==='cga'?0x6864:mode==='tandy'?0x63d4:0x9114,u=(n:number)=>n&65535,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),put=(at:number,value:number)=>{memory[d+u(at)]=value&255;memory[d+u(at+1)]=(value>>>8)&255;};
 const rectangle=mode==='ega'?[cw(0x912c),cw(0x912e),cw(0x9122),cw(0x9124)]:[cw(block+24),cw(block+26),cw(block+14),cw(block+16)];
 const plan=originalCirclePlan(memory,d,x,y,diameter,colour,rectangle);
 if(plan.type==='point'){
  if(mode==='ega')yield* drawOriginalEgaPoint(memory,d,plan.point[0],plan.point[1],colour);else drawOriginalPackedDisplayPoint(memory,d,mode,plan.point[0],plan.point[1],colour);
 }else if(plan.type==='ellipse')yield* drawOriginalDisplaySolidPolygon(memory,d,mode,originalLargeEllipseContour(plan.points),colour,scratch,undefined,undefined,false);
 else if(plan.type==='spans'){
  plan.left.forEach((value,row)=>put(scratch.leftOffset+row*2,value));plan.right.forEach((value,row)=>put(scratch.rightOffset+row*2,value));
  if(mode==='ega')yield* drawOriginalEgaPolygonSpans(memory,d,scratch.leftOffset,scratch.rightOffset,plan.start,plan.count,colour);else drawOriginalPackedPolygonSpans(memory,d,mode,scratch.leftOffset,scratch.rightOffset,plan.start,plan.count,colour);
 }
}
