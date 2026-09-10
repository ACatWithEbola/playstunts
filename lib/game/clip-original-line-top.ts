/** Original top-edge line clipping, 20C9B..20D5E, before continuation 210F8. */
export function clipOriginalLineTop(before:Uint8Array,top:number){
 const record=before.slice(),v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16;
 const get=(o:number)=>v.getInt16(o,true),set=(o:number,n:number)=>v.setUint16(o,n,true),step=v.getUint16(12,true),kind=record[18];
 const oldY=get(6),delta=(signed(top)-oldY)&65535;set(6,top);
 if(kind>=2&&kind<=6){
  if(kind===3)set(2,get(2)-delta);
  else if(kind===4)set(2,get(2)+delta);
  else if(kind===5||kind===6)v.setInt32(0,v.getInt32(0,true)+(kind===5?-1:1)*step*delta,true);
  set(14,get(14)-delta);
 }else if(kind===7||kind===8){
  set(6,oldY);
  if(!step)throw Error('Original line clipping division by zero');
  const numerator=delta*65536;let advance=Math.floor(numerator/step);
  if(advance>65535)throw Error('Original line clipping division overflow');
  if(numerator%step>Math.floor(step/2))advance=(advance+1)&65535;
  set(2,get(2)+(kind===7?-1:1)*advance);
  const remaining=get(14)-signed(advance);set(14,remaining);
  if(remaining<=0){set(14,1);set(6,top);set(2,get(8));}
  else v.setInt32(4,v.getInt32(4,true)+advance*step,true);
 }else throw Error('Original top-edge clipping requires a non-horizontal line');
 return record;
}
