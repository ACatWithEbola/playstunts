import {originalEgaRawBitmapLayout} from './ega-raw-bitmap-layout.ts';
import {fillOriginalEgaPlaneEdges} from './ega-plane-edge-fill.ts';
const u=(n:number)=>n&65535,s=(n:number)=>n<<16>>16;
/** Software-plane branch of original EGA26C2D/26C5F raw bitmap copy.
 * Retains the original plane work list and reverse drawing order. */
export function drawOriginalSoftwareEgaRawBitmap(memory:Uint8Array,offset:number,segment:number,position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy',clipped=true){
 const c=0x209e0,source=u(segment)*16,read=(at:number)=>memory[source+u(at)],word=(at:number)=>read(at)|(read(at+1)<<8),cw=(at:number)=>memory[c+u(at)]|(memory[c+u(at+1)]<<8),put=(at:number,value:number)=>{memory[c+u(at)]=value&255;memory[c+u(at+1)]=(value>>>8)&255;};
 const layout=originalEgaRawBitmapLayout(memory,offset,segment,position,clipped);if(!layout)return;
 if(cw(0x9114)===0xa000)throw Error('EGA raw hardware copy requires its planar hardware path');
 const {height,visible,gap,edges,bits,start,rowGap,planeSize}=layout;let {cursor}=layout;
 let count=0,slot=0;
 for(let guard=0;guard<65536;guard++){
  let mask=read(offset+12+slot)&15;if(!mask)break;
  while(mask){const plane=31-Math.clz32(mask&-mask),destination=cw(0x9114+plane*2);mask&=mask-1;if(destination){put(0x6144+count*2,destination);put(0x613c+count*2,cursor);count++;}}
  if(count>=4)break;slot++;cursor=u(cursor+planeSize);
  if(guard===65535)throw Error('EGA raw plane list has no bounded terminator');
 }
 for(const [flag,fillOperation] of [[operation==='or'?0:read(offset+12)>>4,'clear'],[operation==='and'?0:read(offset+13)>>4,'set']] as const){
  for(let plane=0;plane<4;plane++){const destination=cw(0x9114+plane*2);if((flag&(1<<plane))&&destination)fillOriginalEgaPlaneEdges(memory,destination,start,visible,height,rowGap,bits,edges,fillOperation);}
 }
 const write=(at:number,value:number)=>{at&=0xfffff;memory[at]=operation==='copy'?value:operation==='and'?memory[at]&value:memory[at]|value;};
 const high=(255<<(8-bits))&255,low=255>>>bits;
 for(let entry=count-1;entry>=0;entry--){
  const dest=cw(0x6144+entry*2)*16;cursor=cw(0x613c+entry*2);let target=start;
  for(let row=0;row<Math.max(1,s(height));row++){
   if(!bits){for(let col=0;col<(!clipped&&!visible&&operation!=='copy'?65536:visible);col++){write(dest+target,read(cursor));cursor=u(cursor+1);target=u(target+1);}}
   else {
    let carry=edges&2?(operation==='copy'?memory[(dest+target)&0xfffff]&high:operation==='and'?high:0):(read(cursor-1)<<(8-bits))&255;
    for(let col=0;col<(!clipped&&!visible?65536:visible);col++){const value=read(cursor);cursor=u(cursor+1);write(dest+target,(value>>>bits)|carry);carry=(value<<(8-bits))&255;target=u(target+1);}
    if((edges&1)||!visible)write(dest+target,operation==='copy'?(memory[(dest+target)&0xfffff]&low)|carry:operation==='and'?carry|low:carry);
   }
   target=u(target+rowGap);cursor=u(cursor+gap);
  }
 }
}
