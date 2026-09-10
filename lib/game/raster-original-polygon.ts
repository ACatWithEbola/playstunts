import {originalPolygonEdgePlan} from './original-polygon-edge-plan.ts';
import {prepareOriginalLine} from './prepare-original-line.ts';
import {originalForwardPolygonEdge} from './original-forward-polygon-edge.ts';
import {originalBackwardPolygonEdge} from './original-backward-polygon-edge.ts';
import {rasterOriginalLine} from './raster-original-line.ts';
/** Original solid polygon path 2372A through checked edge generation and 264F0.
 * Span callbacks keep framebuffer allocation and scaling outside the source rules.
 */
export function rasterOriginalPolygon(points:readonly (readonly number[])[],rectangle:readonly number[],color:number,span:(x:number,y:number,count:number,color:number)=>void,pattern?:number,secondaryColor?:number,checked=true){
 let rows={left:Array(480).fill(0) as number[],right:Array(480).fill(0) as number[]},record=new Uint8Array(28);
 for(const event of originalPolygonEdgePlan(points,rectangle,color)){
  if(event.type==='line'){
   const [x0,y0,x1,y1]=event.coordinates;for(const [x,y,c] of rasterOriginalLine(x0,y0,x1,y1,color,rectangle))span(x,y,1,c);
  }else if(event.type==='edge'){
   const [x0,y0,x1,y1]=event.coordinates;record=prepareOriginalLine(x0,y0,x1,y1,rectangle,record).record;
   rows=event.side==='forward'?originalForwardPolygonEdge(record,rectangle,rows,event.clipped):originalBackwardPolygonEdge(record,rectangle,rows,event.clipped,checked);
  }else{
   for(let y=event.start;y<event.start+event.count;y++){const x=rows.left[y],count=((rows.right[y]-x+1)<<16)>>16;if(count>0){
    if(pattern===undefined)span(x,y,count,color&255);
    else{const bits=(y&1)?pattern&255:(pattern>>>8)&255;for(let j=0;j<count;j++){const on=(bits&(128>>>((x+j)&7)))!==0;if(secondaryColor!==undefined)span(x+j,y,1,(on?secondaryColor:color)&255);else if(on)span(x+j,y,1,color&255);}}
   }}
  }
 }
}
