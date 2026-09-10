/** Original right-edge clipping, 20FD9..210F7. Rejection continues at 20F55. */
export function clipOriginalLineRight(before:Uint8Array,right:number){
 const record=before.slice(),v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16;
 const get=(o:number)=>v.getInt16(o,true),set=(o:number,n:number)=>v.setUint16(o,n,true),step=v.getUint16(12,true),kind=record[18],edge=signed(right-1);
 const rounded=(numerator:number)=>{if(!step)throw Error('Original line clipping division by zero');let q=Math.floor(numerator/step);if(q>65535)throw Error('Original line clipping division overflow');if(numerator%step>Math.floor(step/2))q=(q+1)&65535;return q;};
 let reject=false;
 if(kind===2)reject=true;
 else if(kind===3){const delta=(get(2)-edge)&65535;set(2,edge);set(6,get(6)+delta);set(14,get(14)-delta);set(24,get(24)+delta);}
 else if(kind===4){const delta=(get(8)-edge)&65535;set(8,edge);set(26,get(26)+delta);set(14,get(14)-delta);set(10,get(10)-delta);}
 else if(kind===5){
  const advance=rounded((v.getInt32(0,true)-edge*65536)>>>0),remaining=get(14)-signed(advance);set(14,remaining);
  if(remaining<=0)reject=true;else{set(6,get(6)+advance);set(24,get(24)+advance);v.setInt32(0,v.getInt32(0,true)-advance*step,true);}
 }else if(kind===6){
  set(8,edge);const numerator=(edge*65536-v.getInt32(0,true))|0;
  if(numerator<0)reject=true;
  else{const count=(rounded(numerator)+1)&65535;set(26,get(26)+get(14)-count);set(14,count);set(10,count-1+get(6));}
 }else if(kind===7){
  const advance=(get(2)-edge)&65535;set(2,edge);set(14,get(14)-advance);
  const old=v.getInt32(4,true),next=(old+advance*step)|0;v.setInt32(4,next,true);set(24,get(24)+(((next+32768)|0)>>16)-(((old+32768)|0)>>16));
 }else if(kind===8){
  const count=(signed(right)-get(2))&65535;set(8,edge);set(14,count);
  const last=((v.getInt32(4,true)+((count-1)&65535)*step+32768)|0)>>16;set(26,get(26)+get(10)-last);set(10,last);
 }else throw Error('Original right-edge clipping requires a non-horizontal line');
 return {record,rejection:reject?1:0};
}
