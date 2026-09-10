import * as THREE from 'three';
import type {Shape} from './types';
/** Original exp geometry at original world-unit scale. Lighting is modernized. */
export function createDebrisModel(shape:Shape){
 const group=new THREE.Group();
 for(const p of shape.primitives){
  const positions:number[]=[];
  if(p.type===2){
   for(const i of p.indices)positions.push(...shape.vertices[i]);
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   group.add(new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0x101720})));
  }else{
   for(let i=1;i<p.indices.length-1;i++)for(const n of [p.indices[0],p.indices[i],p.indices[i+1]])positions.push(...shape.vertices[n]);
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
   group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xe7bd32,side:THREE.DoubleSide,roughness:.43,metalness:.25})));
  }
 }
 return group;
}
