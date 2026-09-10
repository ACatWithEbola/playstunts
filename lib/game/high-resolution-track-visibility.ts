import type {Matrix4} from 'three';
import type {Shape} from './types.ts';
import {prepareOriginalModelProjection} from './prepare-model-projection.ts';
import {continuousModelVisibility} from './continuous-model-visibility.ts';
import type {Vector} from '../physics/math.ts';
import {backgroundCamera} from './native-background.ts';
import {prepareOriginalView} from './prepare-original-view.ts';
import {originalRoadModelSubmissions} from './road-model-submissions.ts';
import {renderOriginalModelMemory} from './render-model-memory.ts';
import {resetOriginalPrimitiveQueue} from './drain-primitive-queue.ts';
/** Original visibility decisions for unchanged high-resolution road meshes.
 * This owns one scratch memory image and never touches simulation memory.
 */
export function createHighResolutionTrackVisibility(resources:Uint8Array){
 const memory=resources.slice(),d=0x2d1a0,v=new DataView(memory.buffer),recordPointer=0xb300;
 v.setUint16(d+0x558c,0,true);v.setUint16(d+0x558e,0x8000,true);
 const cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 const shapes=new Map<number,{shape:Shape;include:number[];exclude:number[]}>();
 let camera:Vector=[0,0,0];
 const project=(record:readonly number[],visible:boolean[],display?:{matrix:Matrix4;near:number})=>{
  visible.fill(false);resetOriginalPrimitiveQueue(memory,d);memory.set(record,d+recordPointer);
  if(display){
   const prepared=prepareOriginalModelProjection(memory,d,recordPointer,cache),m=prepared.metadata,key=record[6]|record[7]<<8;
   let data=shapes.get(key);
   if(!data){
    const address=(far:number[],off=0)=>((far[1]*16+((far[0]+off)&65535))&0xfffff);
    const primitives:Shape['primitives']=[];let offset=0;
    while(memory[address(m.primitives,offset)]){
     const type=memory[address(m.primitives,offset)],count=memory[d+0x3270+type];
     primitives.push({type,flags:memory[address(m.primitives,offset+1)],materials:Array.from({length:m.paintCount},(_,i)=>memory[address(m.primitives,offset+2+i)]),indices:Array.from({length:count},(_,i)=>memory[address(m.primitives,offset+2+m.paintCount+i)])});
     offset+=2+m.paintCount+count;
    }
    data={shape:{vertices:prepared.vertices,primitives,paintCount:m.paintCount},include:primitives.map((_,i)=>v.getUint32(address(m.includeMasks,i*4),true)),exclude:primitives.map((_,i)=>v.getUint32(address(m.excludeMasks,i*4),true))};shapes.set(key,data);
   }
   continuousModelVisibility(data.shape,data.include,data.exclude,prepared.transform.includeMask,prepared.transform.excludeMask,display.matrix,display.near,visible);return;
  }
  renderOriginalModelMemory(memory,d,recordPointer,cache,undefined,(index,value)=>{visible[index]=value;});
 };
 return {
  begin(frame:{position:Vector;target:Vector;up:Vector},aspect:number,fov:number,rasterHeight=200){
   camera=[frame.position[0],frame.position[1],-frame.position[2]].map(Math.round) as Vector;
   const angles=backgroundCamera(frame.position,frame.target,frame.up).angles;
   // Match the modern square-pixel perspective while evaluating the original
   // visibility in its 200-row coordinate system.
   const width=Math.round(rasterHeight*aspect),scale=Math.round(rasterHeight/2/Math.tan(fov*Math.PI/360));
   [Math.round(width/2),Math.round(rasterHeight/2),scale,scale].forEach((n,i)=>v.setInt16(d+0x4b88+i*2,n,true));
   prepareOriginalView(memory,d,angles,[0,width,0,rasterHeight]);
  },
  road(tile:number,origin:readonly number[],paint:number,visible:boolean[],display?:{matrix:Matrix4;near:number},detail=0){
   visible.fill(false);
   const position=origin.map((n,i)=>Math.round(n)-camera[i]);
   const descriptor=v.getUint16(d+0x2018+tile*14+(detail?6:4),true);
   const record=originalRoadModelSubmissions(memory,d,tile,detail,paint,position).find(s=>(s.record[6]|s.record[7]<<8)===descriptor)?.record;
   if(!record)return;
   project(record,visible,display);
  },
  terrain(id:number,origin:readonly number[],visible:boolean[],underlay=false,display?:{matrix:Matrix4;near:number}){
   // CC2C..CE73 terrain and CF36..D002 elevated underlay records.
   const record=new Uint8Array(20),r=new DataView(record.buffer),descriptor=d+0x2bda+id*14;
   [Math.round(origin[0])-camera[0],Math.round(origin[1])-camera[1],Math.round(origin[2])-camera[2],underlay?0x7820:v.getUint16(descriptor+4,true),origin[1]?0x902a:0x9022,0,0,underlay?0:v.getUint16(descriptor+2,true),underlay?0x800:0x400].forEach((n,i)=>r.setUint16(i*2,n,true));
   record[18]=5;project(Array.from(record),visible,display);
  },
 };
}
