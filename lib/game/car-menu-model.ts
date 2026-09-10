import {initializeOriginalModelDescriptor} from './initialize-model-descriptor.ts';
import {selectOriginalView} from './select-original-view.ts';
import {renderOriginalModelMemory} from './render-model-memory.ts';
import {drainOriginalPrimitiveQueue,type OriginalRasterCall} from './drain-primitive-queue.ts';
import {rasterOriginalDrawCall} from './raster-original-draw-call.ts';
import type {Vector} from '../physics/math.ts';
/** Original menu camera: 24129(35,16,320,100) and atan(-840,2880).
 * Geometry remains the supplied car0 resource, with original materials/raster. */
export function createOriginalCarMenuModel(baseline:Uint8Array,bank:Uint8Array,background:ReadonlyArray<number>,capture?:(memory:Uint8Array,background:Uint8Array,calls:OriginalRasterCall[])=>void){
 const memory=baseline.slice(),d=0x2d1a0,c=0x209e0,v=new DataView(memory.buffer),set=(o:number,n:number)=>v.setUint16(d+o,n,true),bankView=new DataView(bank.buffer,bank.byteOffset,bank.byteLength),count=bankView.getUint16(4,true);
 let index=-1;for(let i=0;i<count;i++)if(String.fromCharCode(...bank.subarray(6+i*4,10+i*4))==='car0'){index=i;break;}
 if(index<0)throw Error('Missing original car0 model');
 const payload=6+count*8,offset=payload+bankView.getUint32(6+count*4+index*4,true),nextOffsets=Array.from({length:count},(_,i)=>payload+bankView.getUint32(6+count*4+i*4,true)).filter(n=>n>offset),end=Math.min(bank.length,...nextOffsets),shape=bank.subarray(offset,end);
 memory.set(shape,0xa0000);initializeOriginalModelDescriptor(memory,d,{offset:0,segment:0xa000},0x7f16);
 set(0x558c,0);set(0x558e,0x8000);[160,50,230,176].forEach((n,i)=>set(0x4b88+i*2,n));
 for(const [off,n] of [[0x5d96,0x9000],[0x5d9e,0x6376],[0x5da0,0],[0x5da2,320],[0x5dae,0],[0x5db0,320],[0x5da4,0],[0x5da6,200],[0x5da8,320]])v.setUint16(c+off,n,true);
 for(let i=0;i<256;i++)v.setUint16(c+0x6376+i*2,(i*320)&65535,true);
 const cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 return {paintCount:shape[2],render(target:Uint8Array,angle:number,paint:number){
  memory.set(target,0x90000);selectOriginalView(memory,d,[0,-46,0],[0,320,0,95],0);
  [9999,-1,9999,-1].forEach((n,i)=>set(0xb100+i*2,n));[0,-840,2880,0x7f16,0xb100,0,0,angle,30000].forEach((n,i)=>set(0xb000+i*2,n));memory[d+0xb012]=0;memory[d+0xb013]=paint;
  const projected=new Map<number,number[][]>();renderOriginalModelMemory(memory,d,0xb000,cache,capture?(index,points)=>projected.set(index,points):undefined);const count=v.getUint16(d+0x8938,true),word=(o:number)=>background[o]|background[o+1]<<8;
  for(let y=0;y<word(2);y++)for(let x=0;x<word(0);x++)memory[0x90000+(((word(10)+y)*320+word(8)+x)&65535)]=background[16+y*word(0)+x];
  const backdrop=capture?memory.slice(0x90000,0xa0000):undefined,calls:OriginalRasterCall[]=[];
  drainOriginalPrimitiveQueue(memory,d,(call,index,counter)=>{if(capture)calls.push({...call,presentationPoints:projected.get(index)});return rasterOriginalDrawCall(memory,d,c,call,{index,counter});});if(capture)capture(memory,backdrop!,calls);target.set(memory.subarray(0x90000,0xa0000));return count;
 }};
}
