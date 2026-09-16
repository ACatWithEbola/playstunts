import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createShowroomCarModel} from '../lib/game/showroom-car-model.ts';
import {createUpgradedRetroLighting,RETRO_SUN} from '../lib/game/upgraded-retro-lighting.ts';
import {SHOWROOM_SUN,SHOWROOM_SHADOW_WORLD_SCALE} from '../lib/game/showroom-lighting.ts';
import type {Assets} from '../lib/game/types.ts';

const assets:Assets=JSON.parse(readFileSync(new URL('../public/game/assets.json',import.meta.url),'utf8'));
const palette=JSON.parse(readFileSync(new URL('../public/game/track-materials.json',import.meta.url),'utf8'));
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

/** Capture the real shared shadow passes without requiring a GPU. Browser QA
 * verifies their visible result; here we verify geometry, units and filters. */
function shadowPasses(model:THREE.Group,options:Parameters<typeof createUpgradedRetroLighting>[0]){
 const scene=new THREE.Scene(),floor=new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),new THREE.MeshBasicMaterial());floor.rotation.x=-Math.PI/2;
 scene.add(model,floor);
 const lighting=createUpgradedRetroLighting(options);lighting.apply(floor,true,false);
 let target:THREE.WebGLRenderTarget|null=null;
 const passes:{camera:THREE.OrthographicCamera;geometry:THREE.BufferGeometry[];fragment?:string;type:number;size:number}[]=[];
 const renderer={autoClear:true,extensions:{has:()=>true},getRenderTarget:()=>target,getClearColor:(value:THREE.Color)=>value.set(0),getClearAlpha:()=>1,setClearColor(){},setRenderTarget(next:THREE.WebGLRenderTarget|null){target=next;},render(source:THREE.Scene,camera:THREE.OrthographicCamera){
  const geometry:THREE.BufferGeometry[]=[];source.traverseVisible(node=>{if(node instanceof THREE.Mesh)geometry.push(node.geometry);});
  const material=source.overrideMaterial??(source.children[0] as THREE.Mesh).material;
  passes.push({camera:camera.clone(),geometry,fragment:material instanceof THREE.ShaderMaterial?material.fragmentShader:undefined,type:target!.texture.type,size:target!.width});
 }} as unknown as THREE.WebGLRenderer;
 lighting.drawShadows(renderer,[model],scene);
 assert.equal(model.visible,true);assert.equal(scene.overrideMaterial,null);
 scene.remove(model);lighting.dispose();floor.geometry.dispose();(floor.material as THREE.Material).dispose();
 return passes;
}

for(const car of assets.cars)await test(`${car.name}: showroom shadow retains game geometry and filtering at all paints and view headings`,()=>{
 const {car0,car1}=assets.shapes['ST'+car.id];
 for(let paint=0;paint<5;paint++){
  const model=createShowroomCarModel(car0,car1,{paint,...palette,paletteMaterial:0});
  for(const angle of [0,Math.PI/2,Math.PI]){
   model.rotation.y=angle;
   const race=model.clone(true);race.scale.setScalar(20);race.position.multiplyScalar(20);
   const game=shadowPasses(race,{}),scaled=shadowPasses(model,{sunDirection:RETRO_SUN,worldScale:SHOWROOM_SHADOW_WORLD_SCALE});
   assert.equal(game.length,4);assert.equal(scaled.length,4);
   assert.deepEqual(scaled[0].geometry,game[0].geometry,'same authored body/wheel caster geometry');
   scaled.forEach((pass,i)=>{assert.equal(pass.size,game[i].size);assert.equal(pass.type,game[i].type);assert.equal(pass.fragment,game[i].fragment,'same receiver and separable soft filter shaders');});
   close(scaled[0].camera.near,game[0].camera.near/20);close(scaled[0].camera.far,game[0].camera.far/20);
   close(scaled[0].camera.right-scaled[0].camera.left,(game[0].camera.right-game[0].camera.left)/20);
   const bounds=new THREE.Box3().setFromObject(model),points=[bounds.min,bounds.max,bounds.getCenter(new THREE.Vector3())];
   for(const point of points){
    const a=point.clone().project(scaled[0].camera),b=point.clone().multiplyScalar(20).project(game[0].camera);
    close(a.x,b.x);close(a.y,b.y);close(a.z,b.z);
   }
   const shown=shadowPasses(model,{sunDirection:SHOWROOM_SUN,worldScale:SHOWROOM_SHADOW_WORLD_SCALE});
   shown.forEach((pass,i)=>assert.equal(pass.fragment,game[i].fragment));
   const sun=shown[0].camera.position.clone().sub(bounds.getCenter(new THREE.Vector3())).normalize();
   close(sun.dot(SHOWROOM_SUN),1);
   // At least one real caster vertex projects beyond the parked footprint;
   // shadows are no longer confined underneath the car at the high race sun.
   model.updateWorldMatrix(true,true);let extension=0;
   model.traverseVisible(node=>{
    if(!(node instanceof THREE.Mesh)||node.userData.originalCarLine||node.userData.originalPresentationSeam)return;
    const vertices=node.geometry.getAttribute('position');
    for(let i=0;i<vertices.count;i++){
     const point=new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(node.matrixWorld);
     const x=point.x-point.y*sun.x/sun.y,z=point.z-point.y*sun.z/sun.y;
     extension=Math.max(extension,bounds.min.x-x,x-bounds.max.x,bounds.min.z-z,z-bounds.max.z);
    }
   });
   assert.ok(extension>.01,'the lowered showroom sun produces a visible extending silhouette');
  }
  model.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}});
 }
});

await test('showroom lighting leaves the game sun unchanged',()=>{
 close(Math.asin(RETRO_SUN.y)*180/Math.PI,70);close(Math.asin(SHOWROOM_SUN.y)*180/Math.PI,35);
 close(SHOWROOM_SHADOW_WORLD_SCALE,1/20);
});
