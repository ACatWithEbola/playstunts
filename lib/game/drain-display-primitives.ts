import {originalCircleRegisterEffect} from './original-circle-register-effect.ts';
import {drainOriginalPrimitiveQueue} from './drain-primitive-queue.ts';
import {DISPLAY_PRIMITIVE_QUEUES} from './display-primitive-queue-layout.ts';
import {drawOriginalDisplayRasterCall} from './display-raster-call.ts';
import type {OriginalEgaBitmapOperation} from './ega-display-bitmap.ts';
/** Execute each raster call before the source queue proceeds or resets.
 * EGA I/O is serviced synchronously by the caller's planar-memory host. */
export function drainOriginalDisplayPrimitives(memory:Uint8Array,d:number,mode:'cga'|'tandy'|'ega',scratch:{leftOffset:number;rightOffset:number},execute:(program:Generator<OriginalEgaBitmapOperation,void,number>)=>void){
 const layout=DISPLAY_PRIMITIVE_QUEUES[mode],c=0x209e0,block=mode==='cga'?0x6864:mode==='tandy'?0x63d4:0x9114,word=(at:number)=>memory[c+at]|(memory[c+at+1]<<8);
 drainOriginalPrimitiveQueue(memory,d,(call,index,counter)=>{
  execute(drawOriginalDisplayRasterCall(memory,d,mode,call,scratch));
  if(call.address===layout.circle){const a=call.args,rectangle=[word(block+24),word(block+26),word(block+14),word(block+16)],effect=originalCircleRegisterEffect(memory,d,a[0],a[1],a[2],a[3],rectangle,counter,index);return {counter:effect.si,index:effect.di};}
 },layout);
}
