import {originalGameTime} from './game-time-format.ts';
export interface OriginalReplayBarHost {
 sprite(offset:number,segment:number):void;
 time(text:string,x:number,y:number):void;
 fill(x:number,y:number,width:number,height:number,color:number):void;
 outline(left:number,top:number,right:number,bottom:number,color:number):void;
}
/** Original1588a..15c99 replay-bar presentation and its two screen caches.
 * Sprite pointers refer to the original loaded SDGAME resource table. */
export function presentOriginalReplayBar(m:Uint8Array,d:number,start:number,current:number,host:OriginalReplayBarHost,address:(mcga:number)=>number=n=>n){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),at=(o:number)=>d+(o&65535),b=(o:number)=>m[at(o)],sb=(o:number)=>b(o)<<24>>24,w=(o:number)=>v.getUint16(at(o),true),sw=(o:number)=>v.getInt16(at(o),true),put=(o:number,n:number)=>{m[at(o)]=n&255;},word=(o:number,n:number)=>v.setUint16(at(o),n,true),s16=(n:number)=>n<<16>>16;
 const screen=sb(address(0x897c)),sprite=(o:number)=>host.sprite(w(o),w(o+2));
 if(!b(address(0x8ff2)+screen)){
  put(address(0x8ff2)+screen,1);put(address(0x552e)+screen,255);put(address(0x54c2)+screen,255);
  for(let i=0;i<9;i++)put(address(0x5534)+2*i+screen,0);
  sprite(address(0x54c8));word(address(0x54c4)+2*screen,65535);word(address(0x5530)+2*screen,65535);
  host.time(originalGameTime(w(address(0x8fd8))+w(address(0xa034))),216,187);
 }
 const clock=(current+w(address(0xa034)))&65535;
 if(w(address(0x54c4)+2*screen)!==clock){word(address(0x54c4)+2*screen,clock);host.time(originalGameTime(clock),152,187);}
 if(b(address(0x552e)+screen)!==b(0x12f)){
  put(address(0x552e)+screen,b(0x12f));word(address(0x5530)+2*screen,65535);sprite(address(0x54cc)+4*sb(0x12f));
  const limit=sb(0x3212+sb(0x12f));if(limit<sb(0x31e9))put(0x31e9,limit);
  if(sb(address(0x54c2)+screen)>6)put(address(0x54c2)+screen,255);
 }
 const length=sw(address(0x8fd8)),left=length?s16(Math.trunc(s16(start)*110/length)):0,right=length?s16(Math.trunc(s16(current)*110/length)):0;
 if(sw(address(0x5530)+2*screen)!==left||sw(address(0x54be)+2*screen)!==right){
  word(address(0x5530)+2*screen,left);word(address(0x54be)+2*screen,right);
  host.fill(154,177,116,6,w(0x4ebc));host.fill(s16(left+154),177,6,6,w(0x4e8a));host.outline(s16(right+154),177,s16(right+159),182,w(0x4ebe));
 }
 const old=b(address(0x54c2)+screen);
 if(old===b(0x31e9)&&Array.from({length:7},(_,i)=>b(address(0x5534)+2*i+screen)===b(address(0x5524)+i)).every(Boolean))return;
 if(old!==255){
  const index=old<<24>>24;sprite((b(address(0x5534)+2*index+screen)?address(0x5500):address(0x54dc))+4*index);put(address(0x54c2)+screen,255);
 }
 for(let i=0;i<7;i++)if(!b(address(0x5524)+i)&&b(address(0x5534)+2*i+screen)){sprite(address(0x54dc)+4*i);put(address(0x5534)+2*i+screen,0);}
 for(let i=0;i<7;i++)if(b(address(0x5524)+i)){put(address(0x5534)+2*i+screen,1);sprite(address(0x5500)+4*i);put(address(0x5534)+2*i+screen,1);}
 put(address(0x54c2)+screen,b(0x31e9));
 if(b(0x31e9)!==255){const i=sb(0x31e9)*2;host.outline(sw(0x3216+i),sw(0x323a+i),sw(0x3228+i),sw(0x324c+i),w(0x4ebe));}
}
