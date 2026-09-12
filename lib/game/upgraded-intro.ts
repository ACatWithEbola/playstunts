import {readOriginalMaterialPatterns} from './original-material-pattern';
import * as THREE from 'three';
import {readUpgradedShape} from './upgraded-submission';
import {createTrackModel} from './track-model';
import {createCarModel} from './car-model';
import {applyUpgradedCarMaterials,addUpgradedCarStudyLights} from './upgraded-car-materials';
import {RETRO_SUN} from './upgraded-retro-lighting';
import {rotateZXY,transpose} from '../physics/rotation';
import {vecTransform,type Vector} from '../physics/math';
/** Same intro geometry and camera, with GPU depth instead of painter ordering. */
export function createUpgradedIntro(memory:Uint8Array,materials:{palette:number[];indices:number[]}){
 const sourceMaterials={...materials,...readOriginalMaterialPatterns(memory)};
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,logarithmicDepthBuffer:true});renderer.toneMapping=THREE.ACESFilmicToneMapping;
 const scene=new THREE.Scene(),world=new THREE.Group();world.scale.z=-1;scene.add(world);
 addUpgradedCarStudyLights(scene,RETRO_SUN);
 const camera=new THREE.PerspectiveCamera();
 const logos=[0x89be,0x8982].map(descriptor=>{const model=createTrackModel(readUpgradedShape(memory,descriptor),sourceMaterials);model.position.set(1024,0,1024);world.add(model);return model;});
 const shape=readUpgradedShape(memory,0x9304),car=createCarModel(shape,0xffffff,{...sourceMaterials,paint:0});applyUpgradedCarMaterials(car,shape);car.scale.setScalar(400);world.add(car);
 return {draw(draw:readonly number[],pose:{position:Vector;heading:number},width:number,height:number){
  const [x,y,z,heading,pitch,showCar,logo]=draw,inverse=transpose(rotateZXY(0,pitch,heading,true)),forward=vecTransform([0,0,16384],inverse),up=vecTransform([0,16384,0],inverse);
  camera.position.set(x,y,-z);camera.up.set(up[0],up[1],-up[2]);camera.lookAt(x+forward[0],y+forward[1],-z-forward[2]);camera.projectionMatrix.makePerspective(-160/192,160/192,100/120,-100/120,1,30000);camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  logos.forEach((model,i)=>{model.visible=i===Number(!!logo);});car.visible=!!showCar;car.position.set(...pose.position.map(n=>n>>6) as Vector);car.rotation.y=-pose.heading*Math.PI/512;
  if(renderer.domElement.width!==width||renderer.domElement.height!==height)renderer.setSize(width,height,false);renderer.render(scene,camera);return renderer.domElement;
 },close(){scene.traverse(node=>{if(node instanceof THREE.Mesh||node instanceof THREE.LineSegments){node.geometry.dispose();for(const m of Array.isArray(node.material)?node.material:[node.material])m.dispose();}});renderer.dispose();renderer.forceContextLoss();}};
}
