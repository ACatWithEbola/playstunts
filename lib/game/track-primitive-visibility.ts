import * as THREE from 'three';
/** Each placement owns its draw index. Immutable vertices remain shared; updating
 * one tile must never hide faces on another placement of the same source model.
 */
export function createTrackPrimitiveVisibility(group:THREE.Group){
 const entries: {geometry:THREE.BufferGeometry;index:THREE.BufferAttribute;ranges:{primitive:number;start:number;count:number}[]}[]=[];
 group.traverse(object=>{
  if(!(object instanceof THREE.Mesh || object instanceof THREE.LineSegments))return;
  const source=object.geometry,ranges=source.userData.originalPrimitiveRanges;
  if(!ranges)return;
  const geometry=new THREE.BufferGeometry();
  for(const name of Object.keys(source.attributes))geometry.setAttribute(name,source.getAttribute(name));
  geometry.boundingBox=source.boundingBox;geometry.boundingSphere=source.boundingSphere;
  const index=new THREE.BufferAttribute(new Uint32Array(source.getAttribute('position').count),1).setUsage(THREE.DynamicDrawUsage);
  geometry.setIndex(index);object.geometry=geometry;entries.push({geometry,index,ranges});
 });
 let prior:string|undefined;
 return {set(visible:readonly boolean[]){
  const key=visible.map(v=>v?'1':'0').join('');if(key===prior)return;prior=key;
  for(const {geometry,index,ranges}of entries){
   let count=0;for(const range of ranges)if(visible[range.primitive])for(let i=0;i<range.count;i++)index.array[count++]=range.start+i;
   index.needsUpdate=true;geometry.setDrawRange(0,count);
  }
 }};
}
