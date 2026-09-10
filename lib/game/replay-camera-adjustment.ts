/** Original15f16..15fb4 camera controls. Limits are pre-update tests,
 * preserving overshoot and signed-word wrapping from retained values. */
export function originalReplayCameraAdjustment(memory:Uint8Array,d:number,command:'left'|'right'|'up'|'down'|'zoom-in'|'zoom-out'){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(o:number)=>v.getInt16(d+o,true),write=(o:number,n:number)=>v.setInt16(d+o,n,true),s16=(n:number)=>n<<16>>16;
 if(command==='left'||command==='right'){write(0x128,word(0x128)+(command==='left'?-16:16));return true;}
 if(command==='up'||command==='down'){
  const next=s16(word(0x12a)+(command==='up'?16:-16));
  if(command==='up'?next>=256:next<=-256)return false;
  write(0x12a,next);return true;
 }
 if(memory[d+0x12f]===3){
  const value=word(0x9334);
  if(command==='zoom-in'?value>=900:value<=0)return false;
  write(0x9334,value+(command==='zoom-in'?30:-30));
 }else{
  const value=word(0x126);
  if(command==='zoom-in'?value<=120:value>=1500)return false;
  write(0x126,value+(command==='zoom-in'?-30:30));
 }
 return true;
}
