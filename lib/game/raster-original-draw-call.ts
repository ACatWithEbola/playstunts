import {originalCircleRegisterEffect} from './original-circle-register-effect.ts';
import type {OriginalRasterCall} from './drain-primitive-queue.ts';
import {rasterOriginalPoint} from './raster-original-point.ts';
import {rasterOriginalLine} from './raster-original-line.ts';
import {rasterOriginalPolygon} from './raster-original-polygon.ts';
import {rasterOriginalCircle} from './raster-original-circle.ts';
import {rasterOriginalWheel} from './raster-original-wheel.ts';
/** Dispatch original raster calls into their original framebuffer address space. */
export function rasterOriginalDrawCall(memory:Uint8Array,d:number,cs:number,call:OriginalRasterCall,registers?:{index:number;counter:number}){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(o:number)=>v.getUint16((cs+(o&65535))&0xfffff,true),signed=(n:number)=>(n<<16)>>16;
 const rectangle=[0x5dae,0x5db0,0x5da4,0x5da6].map(o=>signed(word(o)));
 const span=(x:number,y:number,count:number,color:number)=>{const offset=(word(word(0x5d9e)+y*2)+x)&65535,segment=word(0x5d96);for(let i=0;i<count;i++)memory[(segment*16+((offset+i)&65535))&0xfffff]=color;};
 const a=call.args;
 switch(call.address){
  case 0x2372a:rasterOriginalPolygon(call.points!,rectangle,a[0],span);break;
  case 0x246bc:rasterOriginalPolygon(call.points!,rectangle,a[1],span,a[0]);break;
  case 0x21394:rasterOriginalPolygon(call.points!,rectangle,a[1],span,a[0],a[2]);break;
  case 0x21d98:for(const [x,y,color] of rasterOriginalLine(a[0],a[1],a[2],a[3],a[4],rectangle))span(x,y,1,color);break;
  case 0x24ea8:rasterOriginalCircle(memory,d,a[0],a[1],a[2],a[3],rectangle,span);if(registers){const effect=originalCircleRegisterEffect(memory,d,a[0],a[1],a[2],a[3],rectangle,registers.counter,registers.index);return {counter:effect.si,index:effect.di};}break;
  case 0x28ab2:rasterOriginalWheel(call.points!,a[0],a.slice(1),rectangle,span);break;
  case 0x2795a:rasterOriginalPoint(memory,cs,a[0],a[1],a[2]);break;
  default:throw Error(`Unsupported original raster entry ${call.address.toString(16)}`);
 }
}
