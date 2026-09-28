import * as THREE from 'three';
import {createUpgradedRetroLighting} from '../lib/game/upgraded-retro-lighting.ts';

// GPU regression for issue #14: a car behind a patterned scenery caster must
// never remove that caster's shadow from the ground. Hide the visible car in
// the final image to compare identical receiving pixels, not body pixels.
export function verifyShadowOverlap(){
 const renderer=new THREE.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(640,480);document.body.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),lighting=createUpgradedRetroLighting();
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(3000,3000),new THREE.MeshBasicMaterial({color:0x27641d,side:THREE.DoubleSide}));ground.rotation.x=-Math.PI/2;scene.add(ground);lighting.apply(ground);
 const deck=new THREE.Group(),geometry=new THREE.PlaneGeometry(700,700);geometry.rotateX(-Math.PI/2);
 geometry.setAttribute('originalPattern',new THREE.Float32BufferAttribute(Array.from({length:geometry.attributes.position.count},()=>[1,0xaaaa]).flat(),2));
 deck.add(new THREE.Mesh(geometry,new THREE.MeshBasicMaterial()));deck.position.y=300;deck.userData.retroPatternedShadow=true;scene.add(deck);
 const car=new THREE.Group();car.add(new THREE.Mesh(new THREE.BoxGeometry(140,60,200),new THREE.MeshBasicMaterial()));car.position.y=100;scene.add(car);lighting.apply(car,false);
 const camera=new THREE.PerspectiveCamera(45,640/480,1,5000);camera.position.set(0,1800,0);camera.up.set(0,0,-1);camera.lookAt(0,0,0);
 const casters=[deck],gl=renderer.getContext();
 function capture(showCar:boolean,revision:number){
  car.visible=showCar;deck.visible=true;
  lighting.drawShadows(renderer,[car],scene,casters,new THREE.Vector3(),undefined,revision);
  car.visible=false;deck.visible=false;renderer.render(scene,camera);
  const pixels=new Uint8Array(640*480*4);gl.readPixels(0,0,640,480,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;
 }
 try{
  const without=capture(false,1),withCar=capture(true,2);let brighter=0,darker=0;
  for(let i=0;i<without.length;i+=4){const delta=Math.max(...[0,1,2].map(c=>withCar[i+c]-without[i+c]));if(delta>2)brighter++;if(delta< -2)darker++;}
  if(brighter)throw Error(`Car erased scenery shadow at ${brighter} ground pixels`);
  return {result:'PASS',brighterGroundPixels:brighter,darkerGroundPixels:darker};
 }finally{lighting.dispose();scene.traverse(n=>{if(n instanceof THREE.Mesh){n.geometry.dispose();(n.material as THREE.Material).dispose();}});renderer.dispose();}
}
