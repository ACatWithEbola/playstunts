import {MODEL_DISPLAY_LAYOUTS} from './model-display-layout.ts';
import {selectOriginalView} from './select-original-view.ts';
import {renderOriginalModelMemory} from './render-model-memory.ts';
import type {Vector} from '../physics/math.ts';
export interface OriginalCarModelDisplayHost {unclippedBitmap(pointer:{offset:number;segment:number}):void;primitives(scratch:{leftOffset:number;rightOffset:number}):void;}
/** Original car-menu camera and native model queue through the selected driver.
 * The caller owns model descriptors, raster tables, windows and scratch memory. */
export function createOriginalCarModelDisplay(memory:()=>Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalCarModelDisplayHost,resources:{descriptor:number;record:number;region:number;background:{offset:number;segment:number};rasterScratch:{leftOffset:number;rightOffset:number};viewWidth?:number}){
 const layout=MODEL_DISPLAY_LAYOUTS[mode],cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 return {render(angle:number,paint:number){
  const m=memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength),put=(offset:number,value:number)=>v.setUint16(d+(offset&65535),value&65535,true);
  [160,50,230,176].forEach((n,i)=>put(0x4b88+i*2,n));selectOriginalView(m,d,[0,-46,0],[0,resources.viewWidth??320,0,95],0,layout);
  [9999,-1,9999,-1].forEach((n,i)=>put(resources.region+i*2,n));[0,-840,2880,resources.descriptor,resources.region,0,0,angle,30000].forEach((n,i)=>put(resources.record+i*2,n));m[d+((resources.record+18)&65535)]=0;m[d+((resources.record+19)&65535)]=paint&255;
  renderOriginalModelMemory(m,d,resources.record,cache,undefined,undefined,layout);const count=v.getUint16(d+layout.queue.count,true);
  host.unclippedBitmap(resources.background);host.primitives(resources.rasterScratch);return count;
 }};
}
