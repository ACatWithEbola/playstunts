import * as THREE from 'three';
import type {Shape} from './types.ts';
import type {Vector} from '../physics/math.ts';

/** Bind only native racing wheel slots8..31, leaving covered wheels and spares
 * as supplied. Each end uses its own two radial vectors: native integer rounding
 * can deform the two rims differently, which a single rigid rotation loses. */
export function createUpgradedCarWheelMotion(shape:Shape,model:THREE.Group){
 const primitives=shape.primitives.filter(p=>p.type===12);
 const tires=model.children.filter(node=>node.userData.originalWheelPart==='tire') as THREE.Mesh[];
 const hubs=model.children.filter(node=>node.userData.originalWheelPart==='hub') as THREE.Mesh[];
 const rimFrame=(points:THREE.Vector3[],end:number)=>{
  const at=end*3,center=points[at];
  return new THREE.Matrix4().makeBasis(points[at+1].clone().sub(center),points[3].clone().sub(points[0]),points[at+2].clone().sub(center)).setPosition(center);
 };
 const bindings=primitives.flatMap((primitive,index)=>{
  if(!primitive.indices.every(i=>i>=8&&i<32))return [];
  const rest=primitive.indices.map(i=>new THREE.Vector3(...shape.vertices[i]).multiplyScalar(1/400));
  const radius=rest[0].distanceTo(rest[1]);
  const inverse=[0,1].map(end=>{
   const at=end*3,center=rest[at];
   return new THREE.Matrix4().makeBasis(rest[at+1].clone().sub(center).normalize().multiplyScalar(radius),rest[3].clone().sub(rest[0]),rest[at+2].clone().sub(center).normalize().multiplyScalar(radius)).setPosition(center).invert();
  });
  const meshes=[tires[index],hubs[index]].map(mesh=>{
   mesh.updateMatrix();const positions=mesh.geometry.getAttribute('position');
   const points=Array.from({length:positions.count},(_,i)=>{
    const end=positions.getY(i)>0?1:0;
    return {end,point:new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrix).applyMatrix4(inverse[end])};
   });
   return {mesh,points};
  });
  return [{indices:primitive.indices,meshes}];
 });
 return {update(vertices:readonly Vector[]){
  if(vertices.length!==24)return;
  for(const binding of bindings){
   const points=binding.indices.map(i=>new THREE.Vector3(...vertices[i-8]).multiplyScalar(1/400)),frames=[0,1].map(end=>rimFrame(points,end));
   for(const {mesh,points:rest} of binding.meshes){
    mesh.position.set(0,0,0);mesh.quaternion.identity();mesh.scale.set(1,1,1);mesh.updateMatrix();
    const positions=mesh.geometry.getAttribute('position'),point=new THREE.Vector3();
    rest.forEach((value,i)=>{point.copy(value.point).applyMatrix4(frames[value.end]);positions.setXYZ(i,point.x,point.y,point.z);});
    positions.needsUpdate=true;mesh.geometry.computeBoundingSphere();
   }
  }
 }};
}
