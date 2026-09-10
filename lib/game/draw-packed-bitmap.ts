/** Original25ce8 clipped packed-bitmap copy. Uses the retained active window,
 * scanline table and segment offsets; an unclipped stream ends at its zero
 * marker, even if it contains more pixels than the declared height. */
export function drawOriginalPackedBitmap(memory:Uint8Array,offset:number,segment:number,x:number,y:number,cs=0x209e0,window=0x5d96){
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),u=(n:number)=>n&65535,s=(n:number)=>(n<<16)>>16;
 const source=(segment&65535)*16,word=(base:number,at:number)=>view.getUint16(base+u(at),true);
 const width=word(source,offset);let height=word(source,offset+2),visible=width,gap=0,skip=0,clipped=false;
 x=s(x);y=s(y);
 const left=s(word(cs,window+10)),right=s(word(cs,window+12)),top=s(word(cs,window+14)),bottom=s(word(cs,window+16));
 if(y>=top){
  const end=s(y+height),excess=u(end-bottom);
  if(end>bottom){clipped=true;if(s(height)<=s(excess))return;height=u(height-excess);}
 }else {
  clipped=true;const end=s(y+height);if(end<=top)return;
  const visibleHeight=u(end-top);skip=u((height-visibleHeight)*width);height=visibleHeight;y=top;
  const lower=s(y+height),excess=u(lower-bottom);if(lower>bottom){if(s(height)<=s(excess))return;height=u(height-excess);}
 }
 if(x>=left){
  const end=s(x+width),excess=u(end-right);
  if(end>right){if(s(width)<=s(excess))return;visible=u(width-excess);clipped=true;gap=excess;}
 }else {
  clipped=true;const end=s(x+width);if(end<=left)return;
  let available=u(end-left);skip=u(skip+width-available);const span=u(right-left);
  if(s(available)>=s(span))available=span;gap=u(width-available);visible=available;x=left;
 }
 let cursor=u(offset+16),run=0,literal=false,pixel=0,terminated=false;
 const next=()=>{
  if(!run){const code=memory[source+cursor];cursor=u(cursor+1);if(code===0){terminated=true;return 0;}literal=!!(code&128);run=literal?(-code)&255:code;if(!literal){pixel=memory[source+cursor];cursor=u(cursor+1);}}
  run--;if(literal){const value=memory[source+cursor];cursor=u(cursor+1);return value;}return pixel;
 };
 for(let i=0;i<skip;i++){next();if(terminated)return;}
 let row=u(y*2+word(cs,window+8)),target=u(word(cs,row)+x),remaining=visible;
 const destination=word(cs,window)*16;
 for(let guard=0;guard<0x1000000;guard++){
  const value=next();if(terminated)return;memory[destination+target]=value;target=u(target+1);remaining=u(remaining-1);
  if(s(remaining)<=0){
   if(clipped){height=u(height-1);if(!height)return;for(let i=0;i<gap;i++){next();if(terminated)return;}}
   row=u(row+2);target=u(word(cs,row)+x);remaining=visible;
  }
 }
 throw Error('Original packed bitmap stream has no bounded terminator');
}
