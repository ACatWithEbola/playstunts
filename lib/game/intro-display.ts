import {i16,vecTransform,type Vector} from '../physics/math.ts';
import {MODEL_DISPLAY_LAYOUTS} from './model-display-layout.ts';
import {selectOriginalView} from './select-original-view.ts';
import {renderOriginalModelMemory} from './render-model-memory.ts';
export interface OriginalIntroDisplayHost {bounds(left:number,right:number,top:number,bottom:number):void;clearWindow(colour:number):void;point(x:number,y:number,colour:number):void;primitives(scratch:{leftOffset:number;rightOffset:number}):void;}
/** OriginalFA2E scene drawing with a full-window redraw. Model descriptors,
 * star positions, resource heap and display destination belong to the caller. */
export function createOriginalIntroDisplay(memory:()=>Uint8Array,d:number,mode:'cga'|'tandy'|'ega',host:OriginalIntroDisplayHost,resources:{logo:number;log2:number;car:number;record:number;region:number;stars:readonly Vector[];rasterScratch:{leftOffset:number;rightOffset:number}}){
 const layout=MODEL_DISPLAY_LAYOUTS[mode],cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 return {render(draw:readonly number[],car:{position:Vector;heading:number}){
  const m=memory(),v=new DataView(m.buffer,m.byteOffset,m.byteLength),put=(offset:number,value:number)=>v.setUint16(d+(offset&65535),value&65535,true),[x,y,z,heading,pitch,showCar,logo]=draw;
  [160,100,192,120].forEach((n,i)=>put(0x4b88+i*2,n));selectOriginalView(m,d,[0,pitch,heading],[0,320,0,200],0,layout);
  const submit=(position:Vector,descriptor:number,rotation:number)=>{[0,320,0,200].forEach((n,i)=>put(resources.region+i*2,n));[...position,descriptor,resources.region,0,0,rotation,1024].forEach((n,i)=>put(resources.record+i*2,n));m[d+resources.record+18]=4;m[d+resources.record+19]=0;renderOriginalModelMemory(m,d,resources.record,cache,undefined,undefined,layout);};
  submit([i16(1024-x),i16(-y),i16(1024-z)],logo?resources.logo:resources.log2,0);if(showCar)submit(car.position.map((n,i)=>i16((n>>6)-[x,y,z][i])) as Vector,resources.car,i16(-car.heading));
  host.bounds(0,320,0,200);host.clearWindow(0);const matrix=Array.from({length:9},(_,i)=>v.getInt16(d+layout.address(0xaa5c)+i*2,true));
  for(const star of resources.stars){const p=vecTransform(star.map((n,i)=>i16(n-[x,y,z][i])) as Vector,matrix);if(p[2]<=200)continue;
   const px=i16(160+Math.trunc(p[0]*192/p[2])),py=i16(100-Math.trunc(p[1]*120/p[2])),colour=v.getUint16(d+0x9ac,true);host.point(px,py,colour);let next=(colour+1)&65535;if(next===v.getUint16(d+0x4e8c,true))next=1;put(0x9ac,next);
  }
  const count=v.getUint16(d+layout.queue.count,true);host.primitives(resources.rasterScratch);return count;
 }};
}
