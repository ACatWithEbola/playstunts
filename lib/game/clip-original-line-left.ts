/** Original left-edge clipping, 20E32..20F54. Rejection code 2 continues through
 * rejectOriginalLine; successful records continue at 21150.
 */
export function clipOriginalLineLeft(before:Uint8Array,left:number){
 const record=before.slice(),v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16;
 const get=(o:number)=>v.getInt16(o,true),set=(o:number,n:number)=>v.setUint16(o,n,true),step=v.getUint16(12,true),kind=record[18];left=signed(left);
 const rounded=(numerator:number)=>{if(!step)throw Error('Original line clipping division by zero');let q=Math.floor(numerator/step);if(q>65535)throw Error('Original line clipping division overflow');if(numerator%step>Math.floor(step/2))q=(q+1)&65535;return q;};
 let reject=false;
 if(kind===2)reject=true;
 else if(kind===3){const delta=(left-get(8))&65535;set(8,left);set(22,get(22)+delta);set(14,get(14)-delta);set(10,get(10)-delta);}
 else if(kind===4){const delta=(left-get(2))&65535;set(2,left);set(20,get(20)+delta);set(6,get(6)+delta);set(14,get(14)-delta);}
 else if(kind===5){
  const numerator=(v.getInt32(0,true)-left*65536)|0;set(8,left);
  const count=numerator<0?1:(rounded(numerator)+1)&65535;
  set(22,get(22)+get(14)-count);set(14,count);set(10,count-1+get(6));
 }else if(kind===6){
  const numerator=(left*65536-v.getInt32(0,true))|0;
  if(numerator<0)reject=true;
  else{const advance=rounded(numerator);set(6,get(6)+advance);set(20,get(20)+advance);const remaining=get(14)-signed(advance);set(14,remaining);if(remaining<=0)reject=true;else v.setInt32(0,v.getInt32(0,true)+advance*step,true);}
 }else if(kind===7){
  const advance=(get(2)-left)&65535;set(8,left);set(14,advance+1);
  const last=((v.getInt32(4,true)+advance*step+32768)|0)>>16;set(22,get(22)+get(10)-last);set(10,last);
 }else if(kind===8){
  const advance=(left-get(2))&65535;set(2,left);set(14,get(14)-advance);
  const old=v.getInt32(4,true),next=(old+advance*step)|0;v.setInt32(4,next,true);
  set(20,get(20)+(((next+32768)|0)>>16)-(((old+32768)|0)>>16));
 }else throw Error('Original left-edge clipping requires a non-horizontal line');
 return {record,rejection:reject?2:0};
}
