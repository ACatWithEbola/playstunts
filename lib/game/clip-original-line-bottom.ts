/** Original bottom-edge line clipping, 20D5F..20E31, before 21102. */
export function clipOriginalLineBottom(before:Uint8Array,bottom:number){
 const record=before.slice(),v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16;
 const get=(o:number)=>v.getInt16(o,true),set=(o:number,n:number)=>v.setUint16(o,n,true),kind=record[18],step=v.getUint16(12,true);
 const edge=signed(bottom-1),delta=(get(10)-edge)&65535;set(10,edge);
 if(kind>=2&&kind<=6){
  set(14,get(14)-delta);
  if(kind===3)set(8,get(8)+delta);
  else if(kind===4)set(8,get(8)-delta);
  else if(kind===5||kind===6){const distance=((v.getUint16(14,true)-1)&65535)*step;set(8,((v.getInt32(0,true)+(kind===5?-distance:distance)+32768)|0)>>16);}
 }else if(kind===7||kind===8){
  const numerator=(edge*65536-v.getInt32(4,true))|0;let advance=0;
  if(numerator>=0){
   if(!step)throw Error('Original line clipping division by zero');
   advance=Math.floor(numerator/step);if(advance>65535)throw Error('Original line clipping division overflow');
   if(numerator%step>Math.floor(step/2))advance=(advance+1)&65535;
  }
  set(8,get(2)+(kind===7?-advance:advance));set(14,advance+1);
 }else throw Error('Original bottom-edge clipping requires a non-horizontal line');
 return record;
}
