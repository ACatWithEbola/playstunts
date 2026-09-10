export type OriginalCirclePlan={type:'none'}|{type:'point';point:number[];color:number}|{type:'ellipse';points:number[][];color:number}|{type:'spans';start:number;count:number;left:number[];right:number[];color:number};
/** Original circle raster dispatch and small-circle table spans, 24EA8..25041. */
export function originalCirclePlan(memory:Uint8Array,d:number,x:number,y:number,diameter:number,color:number,rectangle:readonly number[],before={left:Array(480).fill(0) as number[],right:Array(480).fill(0) as number[]}):OriginalCirclePlan{
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(o:number)=>v.getUint16(d+(o&65535),true),signed=(n:number)=>(n<<16)>>16;
 x=signed(x);y=signed(y);diameter&=65535;const quarter=diameter>>>2,height=signed(diameter-quarter+(quarter>>>1));
 if(height<=0)return {type:'none'};
 const half=height>>>1;if(!half)return {type:'point',point:[x,y],color};
 const larger=height-half,[left,right,top,bottom]=rectangle.map(signed),rightEdge=signed(right-1);let start=signed(y-half);
 if(start>=bottom||signed(y+larger)<=top)return {type:'none'};
 const width=signed(larger+(larger>>>2));if(signed(x-width)>rightEdge||signed(x+width)<left)return {type:'none'};
 if(larger>=signed(word(0x3bc8)))return {type:'ellipse',points:[[x,y],[x,signed(y+half)],[signed(x+(diameter>>>1)),y]],color};
 let pointer=word(0x3bca+larger*2),remaining=height,mirror=height-1,cursor=0;const lo=[...before.left],hi=[...before.right];
 while(true){
  const radius=memory[d+(pointer++&65535)];let a=signed(x-radius),b=signed(x+radius);
  if(a<=rightEdge&&b>=left){a=Math.max(a,left);b=Math.min(b,rightEdge);lo[cursor]=lo[cursor+mirror]=a;hi[cursor]=hi[cursor+mirror]=b;cursor++;mirror-=2;if(mirror<0)break;}
  else{start=signed(start+1);remaining=signed(remaining-2);mirror-=2;if(mirror<0)return {type:'none'};}
 }
 let skip=0;const above=signed(top-start);if(above>0){remaining=signed(remaining-above);skip=above;start=top;}
 const below=signed(start+remaining-bottom);if(below>0)remaining=signed(remaining-below);
 const rows=remaining===0?0:Math.max(1,remaining);
 return {type:'spans',start,count:remaining,left:lo.slice(skip,skip+rows),right:hi.slice(skip,skip+rows),color};
}
