const s=(value:number)=>value<<16>>16,u=(value:number)=>value&65535;
export type OriginalEgaFillOperation={kind:'port-byte';port:number;value:number}|{kind:'read';offset:number}|{kind:'write';offset:number;value:number};
/** Original EGA2627E/262E8 rectangle fill, including separate vertical edge
 * passes on hardware. Host owns A000 plane/latch effects and byte I/O. */
export function* fillOriginalEgaDisplayRectangle(memory:Uint8Array,d:number,x:number,y:number,width:number,height:number,colour:number,clipped=true,operation:'copy'|'and'|'or'|'xor'='copy'):Generator<OriginalEgaFillOperation,void,number>{
 const c=0x209e0,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(c+u(at),true);
 [x,y,width,height]=[x,y,width,height].map(s);
 if(clipped){
  const left=s(word(0x911e)<<3),right=s(word(0x9120)<<3),top=s(word(0x9122)),bottom=s(word(0x9124));
  if(left>x){const excess=s(left-x);x=left;const stop=width<=excess;width=s(width-excess);if(stop)return;}
  let edge=s(x+width);if(edge>right){const excess=s(edge-right),stop=width<=excess;width=s(width-excess);if(stop)return;}
  if(top>y){const excess=s(top-y);y=top;const stop=height<=excess;height=s(height-excess);if(stop)return;}
  edge=s(y+height);if(edge>bottom){const excess=s(edge-bottom),stop=height<=excess;height=s(height-excess);if(stop)return;}
 }
 if(width<=0||height<=0)return;
 const maskBase=operation==='copy'?0x5322:operation==='and'?0x56da:operation==='xor'?0x56ca:0x56ea;
 const first=x>>3,last=s(x+width-1)>>3,span=s(last-first),firstMask=memory[d+maskBase+(x&7)],lastMask=memory[d+maskBase+8+(s(x+width-1)&7)],stride=word(0x9126),start=u(word(word(0x911c)+y*2)+first);
 if(word(0x9114)!==0xa000){
  const bytes=span>0?span+1:1,rowStride=span<=0?u(stride-span):stride;
  for(let plane=0;plane<4;plane++){
   const segment=word(0x9114+plane*2);if(!segment)continue;
   for(let row=0;row<height;row++)for(let byte=0;byte<bytes;byte++){
    const mask=(byte===0?firstMask:255)&(byte===bytes-1?lastMask:255),address=(segment*16+u(start+row*rowStride+byte))&0xfffff;
    if(operation==='xor'){if(colour&(1<<plane))memory[address]^=mask;}else if(colour&(1<<plane)){if(operation!=='and')memory[address]|=mask;}else if(operation!=='or')memory[address]&=(~mask&255);
   }
  }
  return;
 }
 const output=function*(port:number,value:number):Generator<OriginalEgaFillOperation,void,number>{yield {kind:'port-byte',port,value};};
 const mask=function*(value:number):Generator<OriginalEgaFillOperation,void,number>{yield* output(0x3ce,8);yield* output(0x3cf,value);};
 const vertical=function*(at:number,bits:number):Generator<OriginalEgaFillOperation,void,number>{
  yield* mask(bits);for(let row=0;row<height;row++){const offset=u(at+row*stride);yield {kind:'read',offset};yield {kind:'write',offset,value:colour&255};}
 };
 yield* output(0x3ce,5);yield* output(0x3cf,2);if(operation!=='copy'){yield* output(0x3ce,3);yield* output(0x3cf,operation==='and'?8:operation==='xor'?24:16);}yield* output(0x3c4,2);yield* output(0x3c5,255);
 if(span<=0)yield* vertical(start,firstMask&lastMask);
 else{
  yield* vertical(start,firstMask);yield* vertical(u(start+span),lastMask);
  if(span>1){yield* mask(255);for(let row=0;row<height;row++)for(let byte=1;byte<span;byte++){const offset=u(start+row*stride+byte);yield {kind:'read',offset};yield {kind:'write',offset,value:colour&255};}}
 }
 yield* mask(255);if(operation!=='copy'){yield* output(0x3ce,3);yield* output(0x3cf,0);}yield* output(0x3ce,5);yield* output(0x3cf,0);
}
