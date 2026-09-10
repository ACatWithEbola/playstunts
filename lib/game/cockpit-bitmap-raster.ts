export type OriginalBitmapOperation='copy'|'and'|'or';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Original25c16,25936,2612a packed, unclipped drawing. The zero run,
 * rather than the bitmap height, terminates these streams. */
export function drawOriginalUnclippedPackedBitmap(m:Uint8Array,off:number,seg:number,x:number,y:number,operation:OriginalBitmapOperation='copy',cs=0x209e0,window=0x5d96){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),word=(base:number,at:number)=>v.getUint16(base+u(at),true),source=u(seg)*16,dest=word(cs,window)*16,width=word(source,off);
 let cursor=u(off+16),row=u(y*2+word(cs,window+8)),target=u(word(cs,row)+x),remaining=width;
 const write=(value:number)=>{const at=dest+target;m[at]=operation==='copy'?value:operation==='and'?m[at]&value:m[at]|value;target=u(target+1);remaining=u(remaining-1);if(s(remaining)<=0){row=u(row+2);target=u(word(cs,row)+x);remaining=width;}};
 for(let guard=0;guard<0x10000;guard++){
  const code=m[source+cursor];cursor=u(cursor+1);if(!code)return;
  if(code<128){const value=m[source+cursor];cursor=u(cursor+1);for(let n=0;n<code;n++)write(value);}
  else for(let n=0;n<256-code;n++){write(m[source+cursor]);cursor=u(cursor+1);}
 }
 throw Error('Original packed bitmap stream has no bounded terminator');
}
/** Original259f0/256c4/25eb8 raw clipped blits. Their single-column fast
 * path increases the destination stride on every row; retain that quirk. */
export function drawOriginalRawBitmap(m:Uint8Array,off:number,seg:number,x:number,y:number,operation:OriginalBitmapOperation|'mapped'='copy',cs=0x209e0){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),word=(base:number,at:number)=>v.getUint16(base+u(at),true),source=u(seg)*16,dest=word(cs,0x5d96)*16;
 const width=word(source,off),left=s(word(cs,0x5da0)),right=s(word(cs,0x5da2)),top=s(word(cs,0x5da4)),bottom=s(word(cs,0x5da6));
 let height=word(source,off+2),cursor=u(off+16),visible=width,gap=0;x=s(x);y=s(y);
 if(y>=top){const excess=s(y+height-bottom);if(excess>0){height=u(height-excess);if(s(height)<=0)return;}}
 else {const count=s(y+height-top);if(count<=0)return;cursor=u(cursor+u(height-count)*width);height=u(count);y=top;const excess=s(y+height-bottom);if(excess>0){height=u(height-excess);if(s(height)<=0)return;}}
 if(x>=left){const excess=s(x+width-right);if(excess>=0){visible=u(width-excess);if(s(visible)<=0)return;gap=u(excess);}}
 else {let count=s(x+width-left);if(count<=0)return;cursor=u(cursor+width-count);const span=s(right-left);if(span<=0)return;if(count>=span)count=span;visible=u(count);gap=u(width-count);x=left;}
 if(s(visible)<=0)return;
 let target=u(word(cs,u(y*2+word(cs,0x5d9e)))+x),stride=word(cs,0x5da8);
 for(let row=0;row<Math.max(1,s(height));row++){
  for(let col=0;col<visible;col++){const at=dest+u(target+col),value=m[source+cursor];cursor=u(cursor+1);if(operation==='mapped'){const mapped=m[cs+0x711c+value];if(mapped!==255)m[at]=mapped;}else m[at]=operation==='copy'?value:operation==='and'?m[at]&value:m[at]|value;}
  cursor=u(cursor+gap);target=u(target+stride);if(operation!=='mapped'&&!gap&&visible===1)stride=u(stride+1);
 }
}
/** Original2658e stores the authored position and captures uncompressed rows. */
export function saveOriginalBitmapBackground(m:Uint8Array,off:number,seg:number,x:number,y:number,cs=0x209e0){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),word=(base:number,at:number)=>v.getUint16(base+u(at),true),destination=u(seg)*16,source=word(cs,0x5d96)*16;
 v.setUint16(destination+u(off+8),u(x),true);v.setUint16(destination+u(off+10),u(y),true);
 const width=word(destination,off),height=word(destination,off+2);let cursor=u(off+16),row=u(y*2+word(cs,0x5d9e));
 for(let n=0;n<Math.max(1,s(height));n++){const start=u(word(cs,row)+x);for(let col=0;col<width;col++){m[destination+cursor]=m[source+u(start+col)];cursor=u(cursor+1);}row=u(row+2);}
}
