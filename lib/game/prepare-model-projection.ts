import {MODEL_DISPLAY_LAYOUTS,type OriginalModelDisplayLayout} from './model-display-layout.ts';
import type {Vector} from '../physics/math.ts';
import type {Matrix} from '../physics/rotation.ts';
import {originalModelRenderMetadata} from './model-render-metadata.ts';
import {originalModelTransformState} from './model-transform-state.ts';
import {projectOriginalModelBounds,type ModelBoundsCache} from './project-model-bounds.ts';
/** Joined original model setup through bounding-vertex acceptance, 16ABA..16E31. */
export function prepareOriginalModelProjection(memory:Uint8Array,d:number,recordPointer:number,before:ModelBoundsCache,layout:OriginalModelDisplayLayout=MODEL_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(o:number)=>v.getInt16(d+(o&65535),true);
 const metadata=originalModelRenderMetadata(memory,d,recordPointer);
 const position=[0,1,2].map(a=>word(recordPointer+a*2)) as Vector,rotation=[0,1,2].map(a=>word(recordPointer+10+a*2)) as Vector;
 const view=Array.from({length:9},(_,i)=>word(layout.address(0xaa5c)+i*2)) as Matrix;
 const ratios=[v.getInt32(d+layout.address(0x5f3e),true),v.getInt32(d+layout.address(0x5f42),true)],masks=Array.from({length:32},(_,i)=>v.getUint32(d+0x3290+i*4,true));
 const transform=originalModelTransformState(position,rotation,view,metadata.flags,word(recordPointer+16),ratios,masks,memory[d+layout.address(0x7fef)]);
 const vertices=Array.from({length:metadata.vertexCount},(_,i)=>[0,1,2].map(a=>v.getInt16((metadata.vertices[1]*16+((metadata.vertices[0]+i*6+a*2)&65535))&0xfffff,true)) as Vector);
 const center=[word(0x4b88),word(0x4b8a)],scale=[word(0x4b8c),word(0x4b8e)],rectangle=[0,1,2,3].map(i=>word(layout.address(0x556a)+i*2));
 const flags=[...before.flags];for(let i=0;i<metadata.vertexCount;i++)flags[i]=255;
 const bounds=projectOriginalModelBounds(vertices,transform.matrix,transform.translation,word(layout.address(0x558a)),center,scale,rectangle,word(recordPointer+16),{...before,flags});
 return {metadata,transform,vertices,bounds,center,scale,rectangle};
}
