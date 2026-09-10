import {originalEgaRawBitmapLayout} from './ega-raw-bitmap-layout.ts';
import {fillOriginalHardwareEgaPlaneEdges} from './ega-hardware-plane-edge-fill.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
export type OriginalEgaRawHardwareOperation=OriginalEgaBitmapOperation|{kind:'write-word';offset:number;value:number};
/** EGA26EC1/27007 raw hardware paths selected by retained display words. */
export function* drawOriginalEgaHardwareRawBitmap(memory:Uint8Array,d:number,offset:number,segment:number,position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy',clipped=true):Generator<OriginalEgaRawHardwareOperation,void,number>{
 const c=0x209e0,source=u(segment)*16,read=(at:number)=>memory[source+u(at)],cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),put=(at:number,value:number)=>{memory[c+u(at)]=value&255;memory[c+u(at+1)]=(value>>>8)&255;};
 const layout=originalEgaRawBitmapLayout(memory,offset,segment,position,clipped);if(!layout)return;
 if(cw(0x9114)!==0xa000)throw Error('EGA hardware raw bitmap requires A000 video memory');
 const dw=(at:number)=>memory[d+at]|(memory[d+at+1]<<8);
 const alternate=dw(0x5638)!==dw(0x563a);
 const {width,height,visible,edges,bits,start,stride,rowGap,planeSize}=layout;
 yield {kind:'port-word',port:0x3ce,value:((operation==='copy'?0:operation==='and'?8:16)<<8)|3};
 let count=0,total=0;
 if(alternate){let cursor=layout.cursor;for(let slot=0;slot<4;slot++){const mask=read(offset+12+slot)&15;if(!mask)break;memory[c+0x6134+count*2]=mask;put(0x613c+count*2,cursor);count++;cursor=u(cursor+planeSize);}}
 else for(let slot=0;slot<4;slot++){
  let mask=read(offset+12+slot)&15;if(!mask)break;
  do {const plane=31-Math.clz32(mask&-mask);put(0x6134+count*2,((plane<<8)|(1<<plane)));put(0x613c+count*2,-visible);count++;mask&=mask-1;}while(mask);
  put(0x613c+(count-1)*2,planeSize-visible);total=u(total+planeSize);
 }
 const reset=u(total-width);
 for(const [flag,fillOperation] of [[operation==='or'?0:read(offset+12)>>4,'clear'],[operation==='and'?0:read(offset+13)>>4,'set']] as const){
  for(let plane=0;plane<4;plane++)if(flag&(1<<plane)){
   yield {kind:'port-word',port:0x3ce,value:(plane<<8)|4};yield {kind:'port-word',port:0x3c4,value:((1<<plane)<<8)|2};
   yield* fillOriginalHardwareEgaPlaneEdges(memory,start,visible,height,rowGap,bits,edges,fillOperation);
  }
 }
 if(alternate){
  const high=(255<<(8-bits))&255,low=255>>>bits;
  for(let entry=count-1;;entry--){
   let cursor=cw(0x613c+entry*2),target=start;
   yield {kind:'port-word',port:0x3c4,value:((memory[c+0x6134+entry*2])<<8)|2};
   for(let row=0;row<Math.max(1,s(height));row++){
    if(!bits){for(let n=0;n<(!clipped&&!visible&&operation!=='copy'?65536:visible);n++){if(operation!=='copy')yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:read(cursor)};cursor=u(cursor+1);target=u(target+1);}}
    else {
     let carry=0,n=0;const shiftedWidth=!clipped&&!visible?65536:visible;
     if(edges&2){yield {kind:'port-word',port:0x3ce,value:(low<<8)|8};const value=read(cursor);cursor=u(cursor+1);yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:value>>>bits};carry=(value<<(8-bits))&255;target=u(target+1);n=1;}
     else carry=(read(cursor-1)<<(8-bits))&255;
     if(n<shiftedWidth){yield {kind:'port-word',port:0x3ce,value:0xff08};for(;n<shiftedWidth;n++){const value=read(cursor);cursor=u(cursor+1);yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:(value>>>bits)|carry};carry=(value<<(8-bits))&255;target=u(target+1);}}
     if((edges&1)||!visible){yield {kind:'port-word',port:0x3ce,value:(high<<8)|8};yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:carry};}
    }
    target=u(target+rowGap);cursor=u(cursor+layout.gap);
   }
   if(entry<=0)break;
  }
  yield {kind:'port-word',port:0x3ce,value:0xff08};yield {kind:'port-word',port:0x3ce,value:3};return;
 }
 let cursor=layout.cursor,target=start;const high=(255<<(8-bits))&255,low=255>>>bits;
 if(count)for(let row=0;row<Math.max(1,s(height));row++){
  for(let entry=0;entry<count;entry++){
   const record=cw(0x6134+entry*2);yield {kind:'port-word',port:0x3c4,value:((record&255)<<8)|2};
   if(!bits){
    if(operation==='copy'&&!(visible&1)){for(let n=0;n<visible;n+=2){const value=memory[(source+cursor)&0xfffff]|(memory[(source+cursor+1)&0xfffff]<<8);yield {kind:'write-word',offset:target,value};cursor=u(cursor+2);target=u(target+2);}}
    else for(let n=0;n<(!clipped&&!visible&&operation!=='copy'?65536:visible);n++){if(operation!=='copy')yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:read(cursor)};cursor=u(cursor+1);target=u(target+1);}
   }else {
    yield {kind:'port-word',port:0x3ce,value:(record&0xff00)|4};
    const original=yield {kind:'read',offset:target};let carry=edges&2?original&high:(read(cursor-1)<<(8-bits))&255;
    for(let n=0;n<(!clipped&&!visible?65536:visible);n++){const value=read(cursor);cursor=u(cursor+1);yield {kind:'write',offset:target,value:(value>>>bits)|carry};carry=(value<<(8-bits))&255;target=u(target+1);yield {kind:'read',offset:target};}
    if((edges&1)||!visible){const original=yield {kind:'read',offset:target};yield {kind:'write',offset:target,value:(original&low)|carry};}
   }
   target=u(target-visible);cursor=u(cursor+cw(0x613c+entry*2));
  }
  target=u(target+stride);cursor=u(cursor-reset);
 }
 yield {kind:'port-word',port:0x3ce,value:3};
}
