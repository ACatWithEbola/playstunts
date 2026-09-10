/** Original 0x1ae48..0x1aea4, retaining signed low-word products before division. */
export function editorScrollbarGeometry(width:number,height:number,value:number,visible:number,total:number){
 const vertical=width<=height?1:0,length=vertical?height:width;
 const signed=(v:number)=>(v<<16)>>16,denominator=signed(total*4);
 if(!denominator)throw Error('Original scrollbar divisor is zero');
 const position=(v:number)=>Math.trunc(signed((length-1)*v*4)/denominator);
 const start=position(value),end=position(value+visible);
 return {vertical,length,start,end,size:signed(end-start)};
}
