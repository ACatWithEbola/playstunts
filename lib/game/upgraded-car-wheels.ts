import * as THREE from 'three';
import type {Shape} from './types.ts';
import type {Vector} from '../physics/math.ts';

/** Bind only native racing wheel slots8..31, leaving covered wheels and spares
 * as supplied. Full-detail car0 geometry is authored at 20x scale, so
 * dynamicVertexScale maps the retained car1 snapshots into its local frame.
 *
 * The six native wheel points are an animation rig, not a replacement mesh.
 * Rebuilding every cylinder vertex from their separately rounded radial vectors
 * squeezed the wheel at full steering lock and exposed a flat cap. Move the
 * showroom cylinder as one rigid wheel instead, retaining its authored radius,
 * depth and hub geometry at every steering angle. */
export function createUpgradedCarWheelMotion(shape:Shape,model:THREE.Group,dynamicVertexScale=1){
 const primitives=shape.primitives.filter(p=>p.type===12);
 const tires=model.children.filter(node=>node.userData.originalWheelPart==='tire') as THREE.Mesh[];
 const hubs=model.children.filter(node=>node.userData.originalWheelPart==='hub') as THREE.Mesh[];
 const rigidFrame=(center:THREE.Vector3,axle:THREE.Vector3,up:THREE.Vector3)=>{
  up.addScaledVector(axle,-up.dot(axle)).normalize();
  const forward=up.clone().cross(axle).normalize();
  return new THREE.Matrix4().makeBasis(up,axle,forward).setPosition(center);
 };
 const bindings=primitives.flatMap((primitive,index)=>{
  if(!primitive.indices.every(i=>i>=8&&i<32))return [];
  const points=primitive.indices.map(i=>new THREE.Vector3(...shape.vertices[i]).multiplyScalar(1/400));
  return [{
   indices:primitive.indices,front:primitive.indices.every(i=>i<20),
   center:points[0].clone().add(points[3]).multiplyScalar(.5),
   axle:points[3].clone().sub(points[0]).normalize(),
   up:points[1].clone().sub(points[0]).normalize(),
   meshes:[tires[index],hubs[index]].filter((mesh):mesh is THREE.Mesh=>!!mesh),
  }];
 });
 return {update(vertices:readonly Vector[]|undefined,steering=0){
  for(const binding of bindings){
   const points=vertices?.length===24?binding.indices.map(i=>new THREE.Vector3(...vertices[i-8]).multiplyScalar(dynamicVertexScale/400)):undefined;
   const center=points?points[0].clone().add(points[3]).multiplyScalar(.5):binding.center.clone();
   // Drive the rigid detailed wheel from the authoritative steering word so
   // V-chase does not depend on whether a low-detail source camera happened to
   // submit car1. Stunts records left as a negative steering value; the same
   // signed car-local Y rotation points the wheel plane toward the turn.
   const angle=binding.front?steering*Math.PI/1024:0;
   const axle=binding.axle.clone().applyAxisAngle(new THREE.Vector3(0,1,0),angle);
   const up=binding.up.clone().applyAxisAngle(new THREE.Vector3(0,1,0),angle);
   const frame=rigidFrame(center,axle,up),position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
   frame.decompose(position,rotation,scale);
   for(const mesh of binding.meshes){mesh.position.copy(position);mesh.quaternion.copy(rotation);mesh.scale.set(1,1,1);}
  }
 }};
}
