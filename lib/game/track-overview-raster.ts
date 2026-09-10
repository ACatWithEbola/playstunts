import {initializeOriginalModelDescriptor} from './initialize-model-descriptor.ts';
import {i16,intAtan2,intHypot,vecTransform,type Vector} from '../physics/math.ts';
import {rotateZXY} from '../physics/rotation.ts';
import {projectOriginalVector} from './project-original-vector.ts';
import {selectOriginalView} from './select-original-view.ts';
import {originalTrackOverviewSubmissions} from './track-overview-submissions.ts';
import {renderOriginalModelMemory} from './render-model-memory.ts';
import {drainOriginalPrimitiveQueue} from './drain-primitive-queue.ts';
import {rasterOriginalDrawCall} from './raster-original-draw-call.ts';
import {drawEditorClippedRaster} from './editor-clipped-raster.ts';
/** SuppliedE7DC..ED57. Caller supplies the currently loaded panorama/model bank. */
export function drawOriginalTrackOverview(target:Uint8Array,baseline:Uint8Array,raw:ReadonlyArray<number>,groundModels:Record<string,ReadonlyArray<number>>){
 const memory=baseline.slice(),d=0x2d1a0,c=0x209e0,v=new DataView(memory.buffer),word=(o:number)=>v.getUint16(d+o,true),signed=(o:number)=>v.getInt16(d+o,true),set=(o:number,n:number)=>v.setUint16(d+o,n,true);
 // The retained driving baseline omitted these overview-only ground models.
 // Install complete supplied GAME2 resources, including masks and primitives.
 for(const [i,name] of ['hig1','hig2','hig3'].entries()){
  const bytes=groundModels[name],address=0xa0000+i*256,descriptor=0x7c40+i*22;memory.set(bytes,address);initializeOriginalModelDescriptor(memory,d,{offset:0,segment:address>>>4},descriptor);
 }
 for(const [field,data] of [[0x9356,raw.slice(0,900)],[0x9ad0,raw.slice(901,1801)]] as const)memory.set(data,word(field+2)*16+word(field));
 const pitch=intAtan2(i16(signed(0x8fe)-signed(0x8f8)),intHypot(i16(signed(0x8fc)-signed(0x8f6)),i16(signed(0x900)-signed(0x8fa))));
 const point=vecTransform([signed(0x902),signed(0x904),signed(0x906)],rotateZXY(0,pitch,0,true)),horizon=Math.max(0,projectOriginalVector(point,[160,100],[192,120])[1]);
 const fill=(top:number,bottom:number,color:number)=>{for(let y=Math.max(0,top);y<Math.min(200,bottom);y++)target.fill(color&255,y*320,(y+1)*320);};
 fill(0,horizon-signed(0x7fe4),word(0x9be2));
 for(const [field,x,heightField]of [[0xa398,0,0x9b30],[0xa39c,320,0x9b32]]){const address=word(field+2)*16+word(field),width=v.getUint16(address,true),height=v.getUint16(address+2,true);drawEditorClippedRaster(target,320,{width,height,pixels:memory.subarray(address+16,address+16+width*height)},x,horizon-signed(heightField),'copy',{left:0,right:320,top:0,bottom:100});}
 fill(horizon,200,word(0x909e));memory.set(target,0x90000);
 [160,100,192,120].forEach((n,i)=>set(0x4b88+i*2,n));set(0x558c,0);set(0x558e,0x8000);
 for(const [off,n]of [[0x5d96,0x9000],[0x5d9e,0x6376],[0x5da0,0],[0x5da2,320],[0x5dae,0],[0x5db0,320],[0x5da4,0],[0x5da6,200],[0x5da8,320]])v.setUint16(c+off,n,true);
 for(let i=0;i<256;i++)v.setUint16(c+0x6376+i*2,(i*320)&65535,true);
 selectOriginalView(memory,d,[0,pitch,0],[0,320,0,200],1);
 const cache={vectors:Array.from({length:256},()=>[0,0,0] as Vector),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 originalTrackOverviewSubmissions(memory,d,record=>{if(record){memory.set(record,d+0xb000);renderOriginalModelMemory(memory,d,0xb000,cache);}else drainOriginalPrimitiveQueue(memory,d,(call,index,counter)=>rasterOriginalDrawCall(memory,d,c,call,{index,counter}));});
 target.set(memory.subarray(0x90000,0xa0000));return {pitch,horizon};
}
