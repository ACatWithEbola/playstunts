const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA26348/26366 and TDY2612E/2614C. Stored positions
 * round down to a whole byte; explicit positions preserve pixel alignment. */
export function drawOriginalPackedDisplayUnclippedBitmap(memory:Uint8Array,mode:'cga'|'tandy',offset:number,segment:number,position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy'){
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,source=u(segment)*16;
 const read=(at:number)=>memory[source+u(at)],word=(at:number)=>read(at)|(read(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8);
 const dest=cw(block)*16,shift=mode==='cga'?2:1,pixelMask=(1<<shift)-1;
 const x=s(position?.x??(word(offset+8)&~pixelMask)),y=s(position?.y??word(offset+10)),width=word(offset),height=word(offset+2),bits=(x&pixelMask)*(mode==='cga'?2:4),byteX=x>>shift;
 const write=(at:number,value:number)=>{memory[dest+at]=operation==='copy'?value:operation==='and'?memory[dest+at]&value:memory[dest+at]|value;};
 let rowPointer=u(cw(block+8)+y*2),cursor=u(offset+16);
 for(let row=0;row<Math.max(1,s(height));row++){
  let target=u(cw(rowPointer)+byteX);
  if(!bits){for(let col=0;col<(width||(operation==='copy'?0:65536));col++){write(target,read(cursor));cursor=u(cursor+1);target=u(target+1);}}
  else {
   const high=(255<<(8-bits))&255;let carry=operation==='copy'?memory[dest+target]&high:operation==='and'?high:0;
   for(let col=0;col<(width||65536);col++){const value=read(cursor);cursor=u(cursor+1);write(target,(value>>>bits)|carry);carry=(value<<(8-bits))&255;target=u(target+1);}
   write(target,operation==='copy'?(memory[dest+target]&(255>>>bits))|carry:operation==='and'?carry|(255>>>bits):carry);
  }
  rowPointer=u(rowPointer+2);
 }
}
