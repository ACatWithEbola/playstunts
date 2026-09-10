import {findOriginalResource} from './find-original-resource.ts';
import {createOriginalCockpitRasterHost} from './cockpit-raster-host.ts';
import {fillOriginalBitmapRectangle} from './fill-bitmap-rectangle.ts';
export interface OriginalCrashOverlayDrawingHost {clip(left:number,right:number,top:number,bottom:number):void;line(x0:number,y0:number,x1:number,y1:number,colour:number):void;rectangle(x:number,y:number,width:number,height:number,colour:number):void;}
/** Original F15C water fill and F1D2 windshield cracks, including the returned
 * dirty rectangle and retained resource lookups. */
export function drawOriginalCrashOverlay(m:Uint8Array,d:number,kind:1|2,elapsed:number,top:number,height:number,bp:number,display?:OriginalCrashOverlayDrawingHost,address:(mcga:number)=>number=n=>n){
 const v=new DataView(m.buffer,m.byteOffset,m.byteLength),u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16,word=(base:number,at:number)=>v.getUint16(base+u(at),true),set=(base:number,at:number,n:number)=>v.setUint16(base+u(at),u(n),true);
 const fallback=createOriginalCockpitRasterHost(()=>m,{selectBackBuffer(){m[d+0x131]=0;},selectFrontBuffer(){m[d+0x131]=1;},selectDirectScreen(){throw Error('Unexpected crash-overlay screen selection');}});
 const raster=display??{...fallback,rectangle:(x:number,y:number,width:number,height:number,colour:number)=>fillOriginalBitmapRectangle(m,x,y,width,height,colour)};
 elapsed=s(elapsed);top=s(top);height=s(height);
 if(kind===2){
  const fill=s(Math.trunc(Math.min(elapsed,80)*height/80)),bottom=s(top+height),first=s(bottom-fill);
  for(const [at,n] of [[address(0xa78e),0],[address(0xa790),320],[address(0xa792),first],[address(0xa794),bottom]])set(d,at,n);
  raster.clip(0,320,first,bottom);raster.rectangle(0,first,320,s(bottom-first),word(d,address(0xa9f2)));return address(0xa78e);
 }
 const lookup=(name:number)=>findOriginalResource(m,d,word(d,address(0x8fbe)),word(d,address(0x8fc0)),name,true)!;
 const lines=lookup(0x950),frames=lookup(0x955),count=s(word(frames.segment*16,frames.offset));let frame=s(Math.trunc(elapsed/2));if(frame>=count)frame=s(count-1);
 const lineCount=s(word(frames.segment*16,frames.offset+u(frame*2)+2)),rectangle=u(bp-0x1c);
 for(let at=0;at<8;at+=2)set(d,rectangle+at,word(d,0x3312+at));
 const addPoint=(x:number,y:number)=>{
  x=s(x);y=s(y);for(const [at,n,minimum] of [[0,x,1],[2,s(x+1),0],[4,y,1],[6,s(y+1),0]]){const current=s(word(d,rectangle+at));if(minimum?current>n:current<n)set(d,rectangle+at,n);}
 };
 for(let line=0;line<lineCount;line++){
  const at=u(lines.offset+line*8),base=lines.segment*16,x0=word(base,at),x1=word(base,at+4),y0=s(Math.trunc(s(word(base,at+2))*height/200)+top),y1=s(Math.trunc(s(word(base,at+6))*height/200)+top);
  raster.line(x0,u(y0-1),x1,u(y1-1),0);raster.line(x0,u(y0+1),x1,u(y1+1),0);raster.line(x0,u(y0),x1,u(y1),word(d,0x4e8a));
  addPoint(x0,y0-1);addPoint(x1,y1+1);addPoint(x0,y0+1);addPoint(x1,y1-1);
 }
 return rectangle;
}
