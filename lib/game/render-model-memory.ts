import {MODEL_DISPLAY_LAYOUTS,type OriginalModelDisplayLayout} from './model-display-layout.ts';
import {projectPresentationWheel} from './presentation-wheel.ts';
import {projectPresentationPolygon} from './project-presentation-polygon.ts';
import {prepareOriginalModelProjection} from './prepare-model-projection.ts';
import {projectOriginalModelPrimitive} from './project-model-primitive.ts';
import {advanceOriginalPrimitiveStream} from './advance-primitive-stream.ts';
import {submitOriginalPrimitiveMemory} from './submit-primitive-memory.ts';
import type {ModelBoundsCache} from './project-model-bounds.ts';
/** Original 16AA0..17A22 model-to-polygon queue. Scratch caches are explicit;
 * source geometry is never modified by this projection stage.
 */
export function renderOriginalModelMemory(memory:Uint8Array,d:number,recordPointer:number,before:ModelBoundsCache,presentationPolygon?:(index:number,points:number[][])=>void,primitiveVisibility?:(primitive:number,visible:boolean)=>void,layout:OriginalModelDisplayLayout=MODEL_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(o:number)=>v.getUint16(d+(o&65535),true),set=(o:number,n:number)=>v.setUint16(d+(o&65535),n,true);
 const address=(far:readonly number[],offset=0)=>(far[1]*16+((far[0]+offset)&65535))&0xfffff;
 if(word(layout.address(0x5588)))return {result:1,drawCount:0};
 const prepared=prepareOriginalModelProjection(memory,d,recordPointer,before,layout),{metadata,transform,vertices,center,scale,rectangle}=prepared;
 memory[d+layout.address(0x7fef)]=transform.bucket;memory[d+layout.address(0x5f28)]=metadata.flags;memory[d+layout.address(0x5f34)]=metadata.paint;set(layout.address(0x5f0c),metadata.paintCount);set(layout.address(0x5f32),metadata.region);set(layout.address(0x5f36),metadata.vertexCount);
 set(layout.address(0x8000),word(layout.address(0x8a44)));set(layout.address(0xa3a8),word(layout.address(0x8a44)));set(layout.address(0x9b5c),0);
 memory[d+layout.address(0x900a)]=prepared.bounds.count;
 if(!prepared.bounds.accepted)return {result:-1,drawCount:0};
 let cache:ModelBoundsCache=prepared.bounds,offset=metadata.primitives[0],includeOffset=metadata.includeMasks[0],excludeOffset=metadata.excludeMasks[0],drawCount=0,primitiveIndex=0;
 const primitiveSegment=metadata.primitives[1];
 while(memory[address([offset,primitiveSegment])]){
  const type=memory[address([offset,primitiveSegment])],flags=memory[address([offset,primitiveSegment],1)],count=memory[d+0x3270+type];
  const next=[(offset+count+metadata.paintCount+2)&65535,primitiveSegment];
  let visible=false;
  if((v.getUint32(address([includeOffset,metadata.includeMasks[1]]),true)&transform.includeMask)!==0){
   const kind=memory[d+0x3280+type],material=memory[address([offset,primitiveSegment],metadata.paint+2)],index=word(layout.address(0x8938));
   const outputFar=[(word(layout.address(0x558c))+word(layout.address(0x5f0a)))&65535,word(layout.address(0x558e))];
   set(layout.address(0x5584),outputFar[0]);set(layout.address(0x5586),outputFar[1]);set(layout.address(0x58b2)+index*4,outputFar[0]);set(layout.address(0x58b4)+index*4,outputFar[1]);
   const output=Array.from({length:20},(_,i)=>[v.getInt16(address(outputFar,6+i*4),true),v.getInt16(address(outputFar,8+i*4),true)]);
   const indices=Array.from({length:count},(_,i)=>memory[address([offset,primitiveSegment],metadata.paintCount+2+i)]);
   const region=Array.from({length:4},(_,i)=>v.getInt16(d+((metadata.region+i*2)&65535),true));
   const faceMask=v.getUint32(address([excludeOffset,metadata.excludeMasks[1]]),true);
   const projected=projectOriginalModelPrimitive(kind,vertices,indices,transform.matrix,transform.translation,word(layout.address(0x558a)),center,scale,rectangle,cache,output,flags,faceMask,transform.excludeMask,region);
   cache=projected.cache;visible=projected.visible;memory[d+layout.address(0x900a)]=projected.count;
   projected.output.forEach((p,i)=>{v.setInt16(address(outputFar,6+i*4),p[0],true);v.setInt16(address(outputFar,8+i*4),p[1],true);});
   projected.rectangle.forEach((n,i)=>set(metadata.region+i*2,n));
   if(visible){
    if(kind===3&&presentationPolygon)presentationPolygon(index,projectPresentationWheel(indices.map(i=>cache.vectors[i]),center,scale));
    if(kind===0&&presentationPolygon)presentationPolygon(index,projectPresentationPolygon(indices.map(i=>cache.vectors[i]),center,scale));
    const submission=submitOriginalPrimitiveMemory(memory,d,projected.depth!,kind,material,flags,drawCount,layout);drawCount=submission.drawCount;
    if(submission.result)return {result:1,drawCount};
   }
  }
  primitiveVisibility?.(primitiveIndex,visible);
  const advanced=advanceOriginalPrimitiveStream(memory,d,next,includeOffset,excludeOffset,visible,flags,metadata.paintCount);
  for(let i=1;i<=advanced.skipped;i++)primitiveVisibility?.(primitiveIndex+i,false);
  primitiveIndex+=1+advanced.skipped;
  offset=advanced.offset;includeOffset=advanced.includeOffset;excludeOffset=advanced.excludeOffset;
 }
 return {result:drawCount?0:-1,drawCount};
}
