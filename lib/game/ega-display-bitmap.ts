import {fillOriginalEgaDisplayRectangle,type OriginalEgaFillOperation} from './ega-display-fill.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
export type OriginalEgaBitmapOperation=OriginalEgaFillOperation|{kind:'port-word';port:number;value:number};
/** EGA282EE/2830C compressed bitmap copy. Plane masks can share a stream;
 * the software and hardware zero-mask paths intentionally differ. */
export function* drawOriginalEgaPackedBitmap(memory:Uint8Array,d:number,offset:number,segment:number,position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy',enableClipping=true):Generator<OriginalEgaBitmapOperation,void,number>{
 const c=0x209e0,source=u(segment)*16,byte=(at:number)=>memory[source+u(at)],word=(at:number)=>byte(at)|(byte(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8);
 if(operation!=='copy')position=undefined;
 let x=s(position?.x??word(offset+8)),y=s(position?.y??word(offset+10));const width=word(offset);let height=word(offset+2);
 if(word(offset+12)&0xf0f0)yield* fillOriginalEgaDisplayRectangle(memory,d,x,y,u(width<<3),height,byte(offset+13)>>4,operation==='copy'&&enableClipping,operation);
 x>>=3;let visible=width,skip=0,gap=0,clipped=false;
 const left=s(cw(0x911e)),right=s(cw(0x9120)),top=s(cw(0x9122)),bottom=s(cw(0x9124));
 if(operation==='copy'&&enableClipping){
 if(y<top){clipped=true;const end=s(y+height);if(end<=top)return;const count=u(end-top);skip=u((height-count)*width);height=count;y=top;}
 let end=s(y+height);if(end>bottom){clipped=true;const excess=u(end-bottom);if(s(height)<=s(excess))return;height=u(height-excess);}
 if(x<left){clipped=true;end=s(x+width);if(end<=left)return;let count=u(end-left);skip=u(skip+width-count);const span=u(right-left);if(s(count)>=s(span))count=span;visible=count;gap=u(width-count);x=left;}
 else {end=s(x+width);if(end>right){const excess=u(end-right);if(s(width)<=s(excess))return;visible=u(width-excess);gap=excess;clipped=true;}}
 }
 const start=u(cw(cw(0x911c)+y*2)+x),stride=cw(0x9126),hardware=cw(0x9114)===0xa000;
 if(hardware&&operation!=='copy')yield {kind:'port-word',port:0x3ce,value:operation==='and'?0x803:0x1003};
 let cursor=u(offset+16),remaining=visible;
 const read=()=>{const value=byte(cursor);cursor=u(cursor+1);return value;};
 const scan=()=>{for(let guard=0;guard<65536;guard++){const code=read();if(!code)return;if(code<128)cursor=u(cursor+1);else cursor=u(cursor+256-code);}throw Error('EGA bitmap stream has no bounded terminator');};
 for(let slot=0;slot<4;slot++){
  let mask=byte(offset+12+slot)&15;const stream=cursor;
  if(hardware){if(!mask){if(operation!=='copy')yield {kind:'port-word',port:0x3ce,value:3};return;}yield {kind:'port-word',port:0x3c4,value:(mask<<8)|2};}
  if(!mask){if(clipped)scan();continue;}
  do {
   cursor=stream;let destination=0;
   if(!hardware){const bit=31-Math.clz32(mask);mask&=(1<<bit)-1;destination=cw(0x9114+bit*2)*16;}
   let target=start,rows=height,skipBytes=clipped?skip:0,finished=false;
   if(clipped||hardware)remaining=visible;
   for(let guard=0;guard<65536;guard++){
    const code=read();if(!code){finished=true;break;}const literal=code>=128,count=literal?256-code:code,value=literal?0:read();
    for(let n=0;n<count;n++){
     const pixel=literal?read():value;
     if(skipBytes){skipBytes=u(skipBytes-1);continue;}
     if(hardware){yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:pixel};}
     else {const at=(destination+target)&0xfffff;memory[at]=operation==='copy'?pixel:operation==='and'?memory[at]&pixel:memory[at]|pixel;}
     target=u(target+1);remaining=u(remaining-1);
     if(s(remaining)<=0){
      if(clipped){rows=u(rows-1);if(!rows){if(literal)cursor=u(cursor+count-n-1);finished=true;break;}skipBytes=gap;}
      target=u(target+stride-visible);remaining=visible;
     }
    }
    if(finished){scan();break;}
   }
   if(!finished)throw Error('EGA bitmap stream has no bounded terminator');
  }while(!hardware&&mask);
 }
 if(hardware&&operation!=='copy')yield {kind:'port-word',port:0x3ce,value:3};
}
