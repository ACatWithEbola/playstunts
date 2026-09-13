import {i16} from '../physics/math.ts';
/** Material 45 is the original model format's live-palette placeholder. */
export function originalPrimitiveMaterial(material:number,palette:number){return (material&255)===45?palette&255:material&255;}
/** Supplied 1793C..179F3: signed power-of-two shifts differ from unsigned division. */
export function originalPrimitiveRecordHeader(depthSum:number,count:number,kind:number,material:number,palette:number,modelFlags:number,primitiveFlags:number){
 count&=255;if(!count)throw Error('Original primitive depth divides by zero');
 depthSum|=0;
 const average=count===1?depthSum:count===2?depthSum>>1:count===4?depthSum>>2:count===8?depthSum>>3:Math.floor((depthSum>>>0)/count);
 return {depth:i16(average),count,kind:kind&255,material:originalPrimitiveMaterial(material,palette),sort:(modelFlags&1)||(primitiveFlags&2)?0:1};
}
