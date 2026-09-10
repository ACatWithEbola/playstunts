import {originalUncheckedPolygonEdge} from './original-unchecked-polygon-edge.ts';
import {rasterCockpitLine} from './cockpit-line-raster.ts';
/** Original checked backward edge path (23AD6, mode1), including clipped tails. */
export function originalBackwardPolygonEdge(record:Uint8Array,rectangle:readonly number[],before:{left:number[];right:number[]},clipped:boolean,checked=true){
 const prepared=checked?before:originalUncheckedPolygonEdge(record,before),left=[...prepared.left],right=[...prepared.right],v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16;
 if(checked&&v.getInt16(14,true)>0){
  for(const [x,y] of rasterCockpitLine(record)){
   if(record[18]<=6){if(right[y]<x)right[y]=x;else if(left[y]>x)left[y]=x;}
   else{left[y]=Math.min(left[y],x);right[y]=Math.max(right[y],x);}
  }
 }
 if(clipped){
  const start=signed(v.getInt16(6,true)+(v.getUint16(4,true)>=32768?1:0)),end=v.getInt16(10,true);
  for(const [offset,side,atStart] of [[20,'left',true],[24,'right',true],[22,'left',false],[26,'right',false]] as const){
   const count=v.getInt16(offset,true),row=atStart?signed(start-count):signed(end+1),edge=side==='left'?rectangle[0]:rectangle[1]-1;
   for(let i=0;i<count;i++)(side==='left'?left:right)[row+i]=signed(edge);
  }
 }
 return {left,right};
}
