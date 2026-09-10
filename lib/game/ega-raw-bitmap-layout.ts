const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
export function originalEgaRawBitmapLayout(memory:Uint8Array,offset:number,segment:number,position?:{x:number;y:number},clipped=true){
 const c=0x209e0,source=u(segment)*16,read=(at:number)=>memory[source+u(at)],word=(at:number)=>read(at)|(read(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8);
 let x=s(position?.x??word(offset+8)),y=s(position?.y??word(offset+10)),height=word(offset+2),cursor=u(offset+16);
 const width=word(offset),left=s(cw(0x911e)),right=s(cw(0x9120)),top=s(cw(0x9122)),bottom=s(cw(0x9124));
 if(clipped&&y<top){const end=s(y+height);if(end<=top)return;const count=u(end-top);cursor=u(cursor+((height-count)&255)*(width&255));height=count;y=top;}
 let end=s(y+height);if(clipped&&end>bottom){const excess=u(end-bottom),stop=s(height)<=s(excess);height=u(height-excess);if(stop)return;}
 const bits=x&7;x>>=3;let visible=width,gap=0,edges=3;
 if(clipped&&x<left){end=s(x+width);if(end<left)return;let count=u(end-left);cursor=u(cursor+width-count);edges=1;const span=u(right-left);if(s(count)>=s(span)){count=span;edges=0;}visible=count;gap=u(width-count);x=left;}
 else if(clipped){end=s(x+width);if(end>=right){edges=2;const excess=u(end-right),stop=s(width)<=s(excess);visible=u(width-excess);if(stop)return;gap=excess;}}
 if(clipped&&s(visible+bits)<=0)return;
 const start=u(cw(cw(0x911c)+y*2)+x),stride=cw(0x9126),rowGap=u(stride-visible),planeSize=u((word(offset+2)&255)*(width&255)+(read(offset+15)>>4));
 return {width,height,cursor,visible,gap,edges,bits,start,stride,rowGap,planeSize};
}
