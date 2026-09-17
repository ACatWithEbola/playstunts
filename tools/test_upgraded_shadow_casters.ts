import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {createCompleteUpgradedCarModel} from '../lib/game/complete-upgraded-car-model.ts';
import {createUpgradedRetroLighting} from '../lib/game/upgraded-retro-lighting.ts';
import {setUpgradedCarGroundContactPanels} from '../lib/game/upgraded-car-materials.ts';
import type {Assets} from '../lib/game/types.ts';

const assets:Assets=JSON.parse(readFileSync(new URL('../public/game/assets.json',import.meta.url),'utf8'));
const palette=JSON.parse(readFileSync(new URL('../public/game/track-materials.json',import.meta.url),'utf8'));
function captureCasters(model:THREE.Group){
 const scene=new THREE.Scene();scene.add(model);const lighting=createUpgradedRetroLighting();
 let target:THREE.WebGLRenderTarget|null=null,casters:THREE.Mesh[]=[];
 const renderer={autoClear:true,extensions:{has:()=>true},getRenderTarget:()=>target,getClearColor:(value:THREE.Color)=>value.set(0),getClearAlpha:()=>0,setClearColor(){},setRenderTarget(next:THREE.WebGLRenderTarget|null){target=next;},render(source:THREE.Scene){
  if(target?.width===512&&target.texture.type===THREE.UnsignedByteType&&!source.overrideMaterial){casters=[];source.traverseVisible(node=>{if(node instanceof THREE.Mesh)casters.push(node);});}
 }} as unknown as THREE.WebGLRenderer;
 return {draw(){lighting.drawShadows(renderer,[model],scene);return [...casters];},close(){lighting.dispose();model.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}});}};
}

for(const car of assets.cars)await test(`${car.name}: shadow proxies preserve authored sidedness and rollover floors`,()=>{
 const {car0,car1}=assets.shapes['ST'+car.id],{model}=createCompleteUpgradedCarModel(car0,car1,0xffffff,{...palette,paint:0,paletteMaterial:46});
 const original:THREE.Mesh[]=[];model.traverse(node=>{if(node instanceof THREE.Mesh&&!node.userData.originalCarLine&&!node.userData.originalPresentationSeam)original.push(node);});
 const harness=captureCasters(model);
 try{
  const casters=harness.draw();assert.equal(casters.length,original.length);
  for(const source of original){const caster=casters.find(mesh=>mesh.geometry===source.geometry)!;assert.ok(caster,'authored geometry must remain available to cast');const materials=Array.isArray(source.material)?source.material:[source.material];assert.equal((caster.material as THREE.Material).side,materials.some(material=>material.side===THREE.DoubleSide)?THREE.DoubleSide:THREE.FrontSide);}
  model.rotation.z=Math.PI;const rolled=harness.draw();assert.equal(rolled.length,casters.length,'rollovers retain every original floor, not a deleted underside');
 }finally{harness.close();}
});

await test('car caster visibility follows changing panels and hidden ancestors after proxy creation',()=>{
 const model=new THREE.Group(),nested=new THREE.Group();model.add(nested);
 const face=new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial());nested.add(face);
 const harness=captureCasters(model);
 try{assert.equal(harness.draw().length,1);face.visible=false;assert.equal(harness.draw().length,0);face.visible=true;assert.equal(harness.draw().length,1);nested.visible=false;assert.equal(harness.draw().length,0);nested.visible=true;assert.equal(harness.draw().length,1);}finally{harness.close();}
});

await test('Countach grounded contact panels stop casting and return when airborne',()=>{
 const {car0,car1}=assets.shapes.STCOUN,{model}=createCompleteUpgradedCarModel(car0,car1,0xffffff,{...palette,paint:0,paletteMaterial:46});
 const harness=captureCasters(model);
 try{const airborne=harness.draw().length;setUpgradedCarGroundContactPanels(model,true);assert.equal(harness.draw().length,airborne-2);setUpgradedCarGroundContactPanels(model,false);assert.equal(harness.draw().length,airborne);}finally{harness.close();}
});
