import {readOriginalMaterialPatterns} from './original-material-pattern';
import * as THREE from 'three';
import {createCarModel} from './car-model';
import {readUpgradedShape} from './upgraded-submission';
import {rotateZXY,transpose} from '../physics/rotation';
import {vecTransform} from '../physics/math';
/** Depth-tested original showroom geometry. Unlike the source painter queue,
 * every face remains available as the car rotates; no simulation is owned here. */
export function createUpgradedCarMenu(palette:number[],indices:number[]){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,logarithmicDepthBuffer:true});renderer.toneMapping=THREE.NoToneMapping;
 const scene=new THREE.Scene(),world=new THREE.Group();world.scale.z=-1;scene.add(world);
 const camera=new THREE.PerspectiveCamera();camera.near=1;camera.far=30000;
 let model:THREE.Group|undefined,bank:Uint8Array|undefined,lastPaint=-1;
 const disposeModel=()=>{model?.traverse(node=>{if(node instanceof THREE.Mesh||node instanceof THREE.LineSegments){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}});if(model)world.remove(model);};
 return {draw(memory:Uint8Array,width:number,height:number){
  const d=0x2d1a0,v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(at:number)=>v.getInt16(d+at,true),paint=memory[d+0xb013];
  if(bank!==memory||lastPaint!==paint){disposeModel();model=createCarModel(readUpgradedShape(memory,0x7f16),0xffffff,{palette,indices,paint,...readOriginalMaterialPatterns(memory)});model.scale.setScalar(400);world.add(model);bank=memory;lastPaint=paint;}
  model!.position.set(0,-840,2880);model!.rotation.y=word(0xb00e)*Math.PI/512;
  const inverse=transpose(rotateZXY(0,-46,0,true)),forward=vecTransform([0,0,16384],inverse),up=vecTransform([0,16384,0],inverse);
  camera.position.set(0,0,0);camera.up.set(up[0],up[1],-up[2]);camera.lookAt(forward[0],forward[1],-forward[2]);
  const [cx,cy,fx,fy]=[0,1,2,3].map(i=>word(0x4b88+i*2));camera.projectionMatrix.makePerspective(-cx/fx,(320-cx)/fx,cy/fy,-(200-cy)/fy,1,30000);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  if(renderer.domElement.width!==width||renderer.domElement.height!==height)renderer.setSize(width,height,false);
  renderer.render(scene,camera);return renderer.domElement;
 },close(){disposeModel();renderer.dispose();renderer.forceContextLoss();}};
}
