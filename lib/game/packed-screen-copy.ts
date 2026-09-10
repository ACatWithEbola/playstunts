const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original CGA28C46 / TDY28648 copies the saved screen into the active
 * window. A shifted copy starts with zero carry and discards the final carry. */
export function copyOriginalPackedDisplayScreen(memory:Uint8Array,mode:'cga'|'tandy',x:number,y:number,width:number,height:number,shift:number){
 const c=0x209e0,block=mode==='cga'?0x6864:0x63d4,pixelShift=mode==='cga'?2:1,cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at)+1]<<8),source=cw(block+30)*16,dest=cw(block)*16;
 const pitch=s(cw(block+22));if(!pitch)throw Error('Original packed screen copy divides by zero');
 const sum=s(x+shift),quotient=Math.trunc(sum/pitch);if(quotient<-32768||quotient>32767)throw Error('Original packed screen copy division overflows');
 const remainder=sum-quotient*pitch,sourceX=u(x)>>>pixelShift,destX=u(sourceX+(s(remainder-u(x))>>pixelShift)),bytes=u(width)>>>pixelShift,bits=(u(shift)&((1<<pixelShift)-1))*(mode==='cga'?2:4);
 let sourceRow=u(cw(block+38)+u(y)*2),destRow=u(cw(block+8)+u(y)*2+quotient*2);
 for(let row=0;row<Math.max(1,s(height));row++){
  let from=u(cw(sourceRow)+sourceX),to=u(cw(destRow)+destX);
  if(!bits){
   for(let n=0;n<(bytes>>>1);n++){const low=memory[source+from],high=memory[source+from+1];memory[dest+to]=low;memory[dest+to+1]=high;from=u(from+2);to=u(to+2);}
   if(bytes&1)memory[dest+to]=memory[source+from];
  }else {
   let carry=0;for(let n=0;n<(bytes||65536);n++){const value=memory[source+from];from=u(from+1);memory[dest+to]=(value>>>bits)|carry;carry=(value<<(8-bits))&255;to=u(to+1);}
  }
  sourceRow=u(sourceRow+2);destRow=u(destRow+2);
 }
}
