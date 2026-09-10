const s=(value:number)=>value<<16>>16,u=(value:number)=>value&65535;
/** Original packed CGA259F8/25A5E and TDY25924/25986 rectangle fills.
 * Pattern is the original two-row byte pair, not a logical colour index. */
export function fillOriginalPackedDisplayRectangle(memory:Uint8Array,d:number,mode:'cga'|'tandy',x:number,y:number,width:number,height:number,pattern:number,clipped=true,operation:'copy'|'xor'='copy'){
 const c=0x209e0,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getUint16(c+u(at),true),base=mode==='cga'?0x6864:0x63d4,shift=mode==='cga'?2:1,pixelsPerByte=1<<shift;
 [x,y,width,height]=[x,y,width,height].map(s);
 if(clipped){
  const left=s(word(base+10)<<shift),right=s(word(base+12)<<shift),top=s(word(base+14)),bottom=s(word(base+16));
  if(left>x){const excess=s(left-x);x=left;const stop=width<=excess;width=s(width-excess);if(stop)return;}
  let edge=s(x+width);if(edge>right){const excess=s(edge-right),stop=width<=excess;width=s(width-excess);if(stop)return;}
  if(top>y){const excess=s(top-y);y=top;const stop=height<=excess;height=s(height-excess);if(stop)return;}
  edge=s(y+height);if(edge>bottom){const excess=s(edge-bottom),stop=height<=excess;height=s(height-excess);if(stop)return;}
 }
 if(width<=0||height<=0)return;
 const segment=word(base),first=x>>shift,start=x&(pixelsPerByte-1),end=s(x+width)&(pixelsPerByte-1),masks=operation==='xor'?(mode==='cga'?0x57a6:0x58e6):(mode==='cga'?0x521a:0x5334);
 const byteCount=u((s(x+width)>>shift)-first)+(end?1:0);
 const firstMask=start?memory[d+masks+start]:255,lastMask=end?memory[d+masks+pixelsPerByte+end]:255;
 for(let row=0;row<height;row++){
  const position=u(y+row),origin=word(word(base+8)+position*2),value=position&1?pattern&255:(pattern>>>8)&255;
  for(let byte=0;byte<byteCount;byte++){
   const column=first+byte;
   const mask=(byte===0?firstMask:255)&(byte===byteCount-1?lastMask:255),address=(segment*16+u(origin+column))&0xfffff;
   memory[address]=operation==='xor'?memory[address]^(value&mask):(memory[address]&(~mask&255))|(value&mask);
  }
 }
}
