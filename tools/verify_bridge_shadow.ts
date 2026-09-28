import * as THREE from 'three';
import {createUpgradedRetroLighting} from '../lib/game/upgraded-retro-lighting';
import {createTrackModel} from '../lib/game/track-model';
import {readOriginalMaterialPatterns} from '../lib/game/original-material-pattern';
import {createCompleteUpgradedCarModel} from '../lib/game/complete-upgraded-car-model';
import assetsData from '../public/game/assets.json';
import palette from '../public/game/track-materials.json';
import type {Assets} from '../lib/game/types';

export async function verifyBridgeShadow(){
 const shapeName=new URLSearchParams(location.search).get('shape')??'brid';
 if(!['brid','zbri','elrd','zelr','elsp','zesp'].includes(shapeName))throw Error('Unknown bridge test model');
 const sloped=shapeName==='brid'||shapeName==='zbri';
 const memory=new Uint8Array(await (await fetch('/game/native-resource-base.bin')).arrayBuffer());
 const materials={...palette,...readOriginalMaterialPatterns(memory)},assets=assetsData as unknown as Assets;
 const renderer=new THREE.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true,preserveDrawingBuffer:true});renderer.setSize(900,650);
 const scene=new THREE.Scene(),world=new THREE.Group();world.scale.z=-1;scene.add(world);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(5000,5000),new THREE.MeshBasicMaterial({color:0x27641d,side:THREE.DoubleSide}));ground.rotation.x=-Math.PI/2;ground.position.set(15000,0,15000);world.add(ground);
 const deck=createTrackModel(assets.shapes.GAME2[shapeName],materials,0,false,4.5);deck.position.set(15000,0,15000);deck.userData.retroPatternedShadow=true;world.add(deck);
 const {car0,car1}=assets.shapes.STCOUN;
 const {model:car,sourceScale}=createCompleteUpgradedCarModel(car0,car1,0xffffff,{...materials,paint:0,paletteMaterial:46});car.scale.setScalar(400/sourceScale);car.position.set(15000,sloped?350:458,15260);car.rotation.x=sloped?-Math.atan(222/514):0;world.add(car);
 const lighting=createUpgradedRetroLighting();lighting.apply(car,false);lighting.apply(world);
 const camera=new THREE.PerspectiveCamera(45,900/650,1,200000);camera.position.set(16000,1700,-16000);camera.lookAt(15000,200,-15000);
 const gl=renderer.getContext(),casters=[deck];let revision=0;
 function capture(casts:boolean,showDeck:boolean){
  car.visible=true;deck.visible=true;lighting.drawShadows(renderer,casts?[car]:[],scene,casters,new THREE.Vector3(15000,0,-15000),undefined,++revision);
  car.visible=false;deck.visible=showDeck;renderer.render(scene,camera);
  const pixels=new Uint8Array(900*650*4);gl.readPixels(0,0,900,650,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;
 }
 const plain=capture(false,false),shadow=capture(true,false);let darker=0,brighter=0;
 for(let i=0;i<plain.length;i+=4){if(plain[i+1]-shadow[i+1]>2)darker++;if(shadow[i+1]-plain[i+1]>2)brighter++;}
 if(darker<150||brighter)throw Error(`Real bridge transmission failed: ${darker} dark, ${brighter} bright pixels`);
 const patterns:THREE.BufferAttribute[]=[];
 deck.traverse(node=>{if(node instanceof THREE.Mesh){const attribute=node.geometry.getAttribute('originalPattern');if(attribute instanceof THREE.BufferAttribute)patterns.push(attribute);}});
 const saved=patterns.map(attribute=>attribute.array.slice());
 for(const attribute of patterns){for(let i=0;i<attribute.count;i++)attribute.setX(i,0);attribute.needsUpdate=true;}
 const solidBefore=capture(false,false),solidAfter=capture(true,false);let solidLeak=0;
 for(let i=0;i<solidBefore.length;i+=4)if(solidBefore[i+1]-solidAfter[i+1]>2)solidLeak++;
 patterns.forEach((attribute,i)=>{attribute.array.set(saved[i]);attribute.needsUpdate=true;});
 if(solidLeak)throw Error(`Opaque bridge leaks ${solidLeak} car-shadow pixels`);
 const angles=[];
 for(const [x,y,z] of [[700,1000,700],[-700,1000,700],[700,1000,-700],[-700,1000,-700]]){
  camera.position.set(15000+x,y,-15000+z);camera.lookAt(15000,180,-15000);
  const a=capture(false,true),b=capture(true,true);let changed=0;
  for(let i=0;i<a.length;i+=4)if(a[i+1]-b[i+1]>2)changed++;
  angles.push({x,z,visibleShadowPixels:changed});
  if(changed<50)throw Error(`Car shadow missing from angle ${x}/${z}: ${changed}`);
 }
 camera.position.set(14300,1000,-14300);camera.lookAt(15000,180,-15000);
 for(const casts of [false,true]){
  car.visible=true;deck.visible=true;lighting.drawShadows(renderer,casts?[car]:[],scene,casters,new THREE.Vector3(15000,0,-15000),undefined,++revision);renderer.render(scene,camera);
  const label=document.createElement('h2');label.textContent=casts?'Car shadow enabled':'Car shadow disabled (comparison)';document.body.appendChild(label);
  const copy=document.createElement('canvas');copy.width=900;copy.height=650;copy.getContext('2d')!.drawImage(renderer.domElement,0,0);document.body.appendChild(copy);
 }
 return {result:'PASS',shapeName,darker,brighter,solidLeak,angles,bridgeMask:materials.masks[sloped?23:22],bridgePattern:materials.patterns[sloped?23:22]};
}
