import {drawOriginalMcgaScaledSprite} from './mcga-scaled-sprite.ts';
export interface OriginalFireballHost {
 bounds(left:number,right:number,top:number,bottom:number):void;
 scaledSprite(pointer:{offset:number;segment:number},scale:number,position:{x:number;y:number}):void;
}
/** Original DCB8..DD98. The model queue flags visible crash-kind-1 cars.
 * The original intersects each car rectangle before selecting its sprite scale. */
export function drawOriginalCrashFireballs(memory:Uint8Array,d:number,rectangle:readonly number[],visibility:{player:number;opponent:number},mode:'mcga'|'cga'|'tandy'|'ega'='mcga',host?:OriginalFireballHost,coverage?:Uint8Array){
 const high={mcga:0,cga:0x5e0,tandy:0x620,ega:0x45c}[mode],v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),s=(n:number)=>n<<16>>16,word=(at:number)=>v.getUint16(d+at+high,true),frame=(word(0x8c26)>>>2)%3;
 for(const [i,visible] of [visibility.player,visibility.opponent].entries()){
  if(!visible)continue;
  const at=0x9032+i*8,b=Array.from({length:4},(_,j)=>s(word(at+j*2))),r=rectangle;
  if(b[1]<b[0]||r[1]<b[0]||b[1]<=r[0]||b[2]>=r[3]||b[3]<=r[2])continue;
  b[0]=Math.max(b[0],r[0]);b[1]=Math.min(b[1],r[1]);b[2]=Math.max(b[2],r[2]);b[3]=Math.min(b[3],r[3]);
  b.forEach((n,j)=>v.setInt16(d+at+high+j*2,n,true));
  const width=s(word(0x9c48+frame*2));if(!width)throw Error('Original fireball sprite is not loaded');
  const extent=Math.max(s(b[1]-b[0]),s(b[3]-b[2])),scale=Math.trunc(extent*256/width)&65535,position={x:Math.trunc(s(b[0]+b[1])/2),y:Math.trunc(s(b[2]+b[3])/2)},pointer={offset:word(0xa3cc+frame*4),segment:word(0xa3ce+frame*4)};
  if(host){host.bounds(b[0],b[1],b[2],b[3]);host.scaledSprite(pointer,scale,position);}
  else {
   for(const [o,n] of [[0x5dae,b[0]],[0x5da0,b[0]],[0x5db0,b[1]],[0x5da2,b[1]],[0x5da4,b[2]],[0x5da6,b[3]]])v.setUint16(0x209e0+o,n,true);
   drawOriginalMcgaScaledSprite(memory,d,pointer.offset,pointer.segment,scale,position,coverage);
  }
 }
}
