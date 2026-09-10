/** Original extreme-coordinate fallback, 2120D..212CC. It shortens endpoints
 * using quarter-differences and retains side-edge counts before rechecking clips.
 */
export function reduceOriginalLineOverflow(before:Uint8Array,rectangle:readonly number[]){
 const record=before.slice(),v=new DataView(record.buffer,record.byteOffset,record.byteLength),signed=(n:number)=>(n<<16)>>16;
 const get=(o:number)=>v.getInt16(o,true),set=(o:number,n:number)=>v.setUint16(o,n,true),[left,,top,bottom]=rectangle.map(signed);
 const dy=signed((get(10)>>1)-(get(6)>>1))>>1,dx=signed((get(8)>>1)-(get(2)>>1))>>1;
 const shortenStart=()=>{
  const y=signed(get(6)+dy);set(6,y);let rows=signed(y-top);
  if(rows>0){rows=Math.min(rows,dy);const below=signed(y-bottom);if(below>0)rows=signed(rows-below);if(rows>0){const offset=get(2)<left?20:24;set(offset,get(offset)+rows);}}
  set(2,get(2)+dx);
 };
 while(get(6)<=-16000)shortenStart();
 while(true){
  if(get(10)<16000){
   if(get(2)<=-16000||get(2)>=16000){shortenStart();while(get(6)<=-16000)shortenStart();continue;}
   if(get(8)>-16000&&get(8)<16000)break;
  }
  const y=signed(get(10)-dy);set(10,y);let rows=signed(y-bottom+1);
  if(rows<0){rows=Math.min(signed(-rows),dy);const above=signed(y-top+1);if(above<0)rows=signed(rows+above);if(rows>0){const offset=get(8)<left?22:26;set(offset,get(offset)+rows);}}
  set(8,get(8)-dx);
 }
 return record;
}
