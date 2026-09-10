import {drawOriginalPackedPatternSpans} from './packed-pattern-spans.ts';
import {originalPolygonEdgePlan} from './original-polygon-edge-plan.ts';
import {prepareOriginalLine} from './prepare-original-line.ts';
import {originalForwardPolygonEdge} from './original-forward-polygon-edge.ts';
import {originalBackwardPolygonEdge} from './original-backward-polygon-edge.ts';
import {drawOriginalPackedDisplayLine} from './packed-display-line.ts';
import {drawOriginalEgaDisplayLine} from './ega-display-line.ts';
import {drawOriginalPackedPolygonSpans} from './packed-polygon-spans.ts';
import {drawOriginalEgaPolygonSpans} from './ega-polygon-spans.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
/** Native common polygon traversal with original mode-specific lines/spans.
 * Caller provides the two 480-word edge buffers used by the original frame. */
export function* drawOriginalDisplaySolidPolygon(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',points:readonly (readonly number[])[],colour:number,scratch:{leftOffset:number;rightOffset:number},pattern?:number,secondary?:number,checked=true):Generator<OriginalEgaBitmapOperation,void,number>{
 const c=0x209e0,block=mode==='cga'?0x6864:mode==='tandy'?0x63d4:0x9114,u=(n:number)=>n&65535,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),dw=(at:number)=>(memory[d+u(at)]|(memory[d+u(at+1)]<<8))<<16>>16,put=(at:number,value:number)=>{memory[d+u(at)]=value&255;memory[d+u(at+1)]=(value>>>8)&255;};
 if(pattern!==undefined)put(0x4b20,pattern);
 if(secondary!==undefined)put(0x4b22,secondary);
 const rectangle=mode==='ega'?[cw(0x912c),cw(0x912e),cw(0x9122),cw(0x9124)]:[cw(block+24),cw(block+26),cw(block+14),cw(block+16)];
 let rows={left:Array.from({length:480},(_,row)=>dw(scratch.leftOffset+row*2)),right:Array.from({length:480},(_,row)=>dw(scratch.rightOffset+row*2))},record=new Uint8Array(28);
 for(const event of originalPolygonEdgePlan(points,rectangle,colour)){
  if(event.type==='line'){
   const [x0,y0,x1,y1]=event.coordinates;if(mode==='ega')yield* drawOriginalEgaDisplayLine(memory,d,x0,y0,x1,y1,colour);else drawOriginalPackedDisplayLine(memory,d,mode,x0,y0,x1,y1,colour);
  }else if(event.type==='edge'){
   const [x0,y0,x1,y1]=event.coordinates;record=prepareOriginalLine(x0,y0,x1,y1,rectangle,record).record;
   rows=event.side==='forward'?originalForwardPolygonEdge(record,rectangle,rows,event.clipped):originalBackwardPolygonEdge(record,rectangle,rows,event.clipped,checked);
   for(let row=0;row<480;row++){put(scratch.leftOffset+row*2,rows.left[row]);put(scratch.rightOffset+row*2,rows.right[row]);}
  }else {
   const left=u(scratch.leftOffset+event.start*2),right=u(scratch.rightOffset+event.start*2);
   if(mode==='ega')yield* drawOriginalEgaPolygonSpans(memory,d,left,right,event.start,event.count,colour,pattern!==undefined,secondary!==undefined);else if(pattern!==undefined)drawOriginalPackedPatternSpans(memory,d,mode,left,right,event.start,event.count,colour,secondary!==undefined);else drawOriginalPackedPolygonSpans(memory,d,mode,left,right,event.start,event.count,colour);
  }
 }
}
