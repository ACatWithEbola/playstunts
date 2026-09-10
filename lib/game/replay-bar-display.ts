import {presentOriginalReplayBar} from './replay-bar-presentation.ts';
import {COCKPIT_DISPLAY_LAYOUTS} from './cockpit-display-layout.ts';
export interface OriginalReplayBarDisplayHost {
 selectBackBuffer():void;selectFrontBuffer():void;
 unclippedPackedBitmap(pointer:{offset:number;segment:number}):void;
 text(text:number,x:number,y:number,opaque?:boolean):void;
 rectangle(x:number,y:number,width:number,height:number,colour:number,clipped?:boolean):void;
}
/** Original mode1 replay controls over the selected native display backend. */
export function drawOriginalReplayBarDisplay(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalReplayBarDisplayHost,start:number,current:number){
 const a=COCKPIT_DISPLAY_LAYOUTS[mode],v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
 const word=(base:number,at:number)=>v.getUint16(base+u(at),true),put=(base:number,at:number,n:number)=>v.setUint16(base+u(at),u(n),true);
 const font=(at:number)=>{const segment=word(d,at+2);put(d,0x4dd2,segment);put(d,a(0xa004),word(segment*16,word(d,at)+14));};
 presentOriginalReplayBar(memory,d,start,current,{
  sprite(offset,segment){host.selectBackBuffer();host.unclippedPackedBitmap({offset,segment});},
  time(text,x,y){
   for(let i=0;i<=text.length;i++)memory[d+u(a(0xa9f4)+i)]=i===text.length?0:text.charCodeAt(i);
   const oldFont=word(d,0x4dd2)*16;put(oldFont,0,word(d,0x4e8a)&(mode==='cga'?3:15));put(oldFont,2,0);host.selectBackBuffer();font(a(0xa006));host.text(a(0xa9f4),x,y,true);font(a(0x9ada));
  },
  fill(x,y,width,height,colour){host.selectBackBuffer();host.rectangle(x,y,width,height,colour,false);},
  outline(left,top,right,bottom,colour){
   host.selectBackBuffer();const width=s(right-left+1),height=s(bottom-top);
   if(width>0){host.rectangle(left,top,width,1,colour);host.rectangle(left,bottom,width,1,colour);}
   if(height>0){host.rectangle(left,top,1,height,colour);host.rectangle(right,top,1,height,colour);}
  },
 },a);
 host.selectFrontBuffer();
}
