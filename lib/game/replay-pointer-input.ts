import {intAtan2} from '../physics/math.ts';
/** Original15c9c..15df8 after the host supplies its translated input key.
 * DS132 gates pointer hit tests; rectangle edges are inclusive. */
export function originalReplayPointerInput(m:Uint8Array,d:number,key:number,prepare=true){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),at=(o:number)=>d+(o&65535),s8=(o:number)=>m[at(o)]<<24>>24,s16=(n:number)=>n<<16>>16,w=(o:number)=>v.getInt16(at(o),true);
 key&=65535;
 const limit=s8(0x3212+s8(0x12f));if(prepare){if(limit<s8(0x31e9)&&m[d+0x12f]!==2)m[d+0x31e9]=limit&255;
 if(m[d+0xaa46])m[d+0x897c]=m[d+0x8998]^1;}
 const x=w(0xa77c),y=w(0xa7de);
 const hit=(count:number,left:number,right:number,top:number,bottom:number)=>{
  if(m[d+0x132])for(let i=0;i<count;i++)if(w(left+i*2)<=x&&w(right+i*2)>=x&&w(top+i*2)<=y&&w(bottom+i*2)>=y)return i;
  return -1;
 };
 const hovered=hit(limit+1,0x3216,0x3228,0x323a,0x324c);
 if(hovered!==-1){
  if(hovered!==m[d+0x31e9]&&key===0)key=1;
  m[d+0x31e9]=hovered;
  if((key===13||key===32)&&s8(0x31e9)>=7){
   const centerY=Math.trunc(s16(w(hovered===7?0x3248:0x324a)+w(hovered===7?0x325a:0x325c))/2);
   if(hovered===7)key=centerY>=y?0x4800:0x5000;
   else{
    const centerX=Math.trunc(s16(w(0x3226)+w(0x3238))/2),dx=s16(x-centerX),dy=s16(centerY-y);
    // Original atan(0,0) retains incoming AX, here the computed centerX.
    const angle=dx===0&&dy===0?centerX:intAtan2(dx,dy);
    key=[0x4800,0x4d00,0x5000,0x4b00][((angle+128)&1023)>>>8];
   }
  }
 }else if(hit(1,0x325e,0x3260,0x3262,0x3264)===0&&(key===13||key===32))key=99;
 return key;
}
