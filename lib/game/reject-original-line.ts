/** Original rejected-line bookkeeping, 20F55..20FD8. Side rejection contributes
 * clipped row counts used by polygon edge generation, even when no line is drawn.
 */
export function rejectOriginalLine(before:Uint8Array,code:number,top:number,bottom:number){
 const record=before.slice(),v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16;
 const get=(o:number)=>v.getInt16(o,true),set=(o:number,n:number)=>v.setUint16(o,n,true);
 code&=255;top=signed(top);bottom=signed(bottom);record[19]=code;set(14,0);
 if(code&4){set(6,top);set(4,0);set(10,top-1);}
 else if(code&8){set(6,bottom);set(4,0);}
 else{
  let last=get(10);if(last>=bottom)last=signed(bottom-1);
  let first=signed(get(6)+(v.getUint16(4,true)>=32768?1:0));if(first<top)first=top;
  set(6,first);set(4,0);set(10,first-1);
  const count=signed(last-first+1),offset=code&2?22:26;set(offset,get(offset)+count);
 }
 return {record,result:code};
}
