import {originalRandomByte} from './original-random.ts';
import {initializeOriginalModelDescriptor} from './initialize-model-descriptor.ts';
import {i16,vecTransform,type Vector} from '../physics/math.ts';
import {selectOriginalView} from './select-original-view.ts';
import {renderOriginalModelMemory} from './render-model-memory.ts';
import {drainOriginalPrimitiveQueue,type OriginalRasterCall} from './drain-primitive-queue.ts';
/** Same original TITLE.P3S resources and descriptor layout used by F548/FA2E. */
export function createOriginalIntroRenderer(baseline:Uint8Array,shapes:Record<string,{bytes:number[]}>,seed?:ReadonlyArray<number>){
 const memory=baseline.slice(),d=0x2d1a0,v=new DataView(memory.buffer),set=(p:number,n:number)=>v.setUint16(d+p,n,true);
 let address=0xa0000;
 for(const [name,descriptor] of [['logo',0x8982],['log2',0x89be],['brav',0x9304]] as const){
  const bytes=Uint8Array.from(shapes[name].bytes),segment=address>>>4;
  memory.set(bytes,address);initializeOriginalModelDescriptor(memory,d,{offset:0,segment},descriptor);
  address=(address+bytes.length+15)&~15;
 }
 set(0x558c,0);set(0x558e,0x8000);[160,100,192,120].forEach((n,i)=>set(0x4b88+i*2,n));
 if(seed){if(seed.length!==6)throw Error('Original intro requires six retained random bytes');memory.set(seed,d+0x9f5c);}
 const next=()=>originalRandomByte(memory,d);
 const stars=Array.from({length:100},()=>[i16((next()<<7)-16384),i16(-((next()<<7)-5000)),i16((next()<<7)-16384)] as Vector);
 const cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 return {memory,stars,get randomState(){return Array.from(memory.subarray(d+0x9f5c,d+0x9f62));},render(draw:readonly number[],car:{position:Vector;heading:number},emit:(call:OriginalRasterCall)=>void,highResolution=false){
  const [x,y,z,heading,pitch,showCar,logo]=draw;
  selectOriginalView(memory,d,[0,pitch,heading],[0,320,0,200],0);
  const presentation=new Map<number,number[][]>();
  const submit=(position:Vector,descriptor:number,rotation:number)=>{
   [0,320,0,200].forEach((n,i)=>set(0xb100+i*2,n));
   [...position,descriptor,0xb100,0,0,rotation,1024].forEach((n,i)=>set(0xb000+i*2,n));memory[d+0xb012]=4;memory[d+0xb013]=0;
   renderOriginalModelMemory(memory,d,0xb000,cache,highResolution?(index,points)=>presentation.set(index,points):undefined);
  };
  submit([i16(1024-x),i16(-y),i16(1024-z)],logo?0x8982:0x89be,0);
  if(showCar)submit(car.position.map((n,i)=>i16((n>>6)-[x,y,z][i])) as Vector,0x9304,i16(-car.heading));
  const matrix=Array.from({length:9},(_,i)=>v.getInt16(d+0xaa5c+i*2,true));
  for(const star of stars){const p=vecTransform(star.map((n,i)=>i16(n-[x,y,z][i])) as Vector,matrix);if(p[2]<=200)continue;
   const px=i16(160+Math.trunc(p[0]*192/p[2])),py=i16(100-Math.trunc(p[1]*120/p[2])),color=v.getUint16(d+0x9ac,true);
   emit({address:0x2795a,args:[px,py,color]});let next=(color+1)&65535;if(next===v.getUint16(d+0x4e8c,true))next=1;set(0x9ac,next);
  }
  drainOriginalPrimitiveQueue(memory,d,(call,index)=>{const points=presentation.get(index);emit(points&&points.length>=3?{...call,presentationPoints:points}:call);});
 }};
}
