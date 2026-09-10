import {rasterCockpitLine} from './cockpit-line-raster.ts';
/** Original forward polygon edge arrays, 23945/239DF..23AD5. */
export function originalForwardPolygonEdge(record:Uint8Array,rectangle:readonly number[],before:{left:number[];right:number[]},clipped:boolean){
 const left=[...before.left],right=[...before.right],v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16;
 if(clipped){
  const start=signed(v.getInt16(6,true)+(v.getUint16(4,true)>=32768?1:0)),end=v.getInt16(10,true);
  for(const [offset,edge,atStart] of [[20,rectangle[0],true],[24,rectangle[1],true],[22,rectangle[0],false],[26,rectangle[1],false]] as const){
   const count=v.getInt16(offset,true),row=atStart?signed(start-count):signed(end+1);
   for(let i=0;i<count;i++){left[row+i]=signed(edge);right[row+i]=signed(edge-1);}
  }
 }
 if(v.getInt16(14,true)>0){
  let row:number|undefined,min=0,max=0;
  for(const [x,y] of rasterCockpitLine(record)){
   if(y!==row){if(row!==undefined){left[row]=min;right[row]=max;}row=y;min=max=x;}
   else{min=Math.min(min,x);max=Math.max(max,x);}
  }
  if(row!==undefined){left[row]=min;right[row]=max;}
 }
 return {left,right};
}
