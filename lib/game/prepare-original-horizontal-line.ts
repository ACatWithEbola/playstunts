/** Horizontal branch of original line preparation, 2115D..2120A.
 * Preserves offscreen endpoint/edge flags, signed word comparisons, and retained
 * slope/color fields. The raster clip X limits are CS:5DAE/5DB0 in this path.
 */
export function prepareOriginalHorizontalLine(start:number,end:number,y:number,rectangle:readonly number[],before:Uint8Array){
 const record=before.slice(),v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16;
 const set=(o:number,n:number)=>v.setUint16(o,n,true),get=(o:number)=>v.getInt16(o,true);
 start=signed(start);end=signed(end);y=signed(y);
 for(const o of [0,4,20,22,24,26])set(o,0);
 set(2,start);set(6,y);set(8,end);set(10,y);set(18,start===end?9:start>end?0:1);
 if(start>end){[start,end]=[end,start];set(2,start);set(8,end);}
 const [left,right,top,bottom]=rectangle.map(signed);
 const reject=(code:number)=>{record[19]=code;set(14,0);return {result:code,record};};
 if(y<top){set(6,top);set(10,top);return reject(4);}
 if(y>=bottom){set(6,bottom);set(10,bottom);return reject(8);}
 set(14,end-start+1);
 if(end<left){set(10,y-1);set(22,1);return reject(2);}
 if(start>=right){set(10,y-1);set(26,1);return reject(1);}
 const leftDelta=signed(left-start);if(leftDelta>0){set(2,left);set(14,get(14)-leftDelta);}
 const rightEdge=signed(right-1),rightDelta=signed(end-rightEdge);if(rightDelta>0){set(14,get(14)-rightDelta);set(8,rightEdge);}
 return {result:0,record};
}
