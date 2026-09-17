import * as THREE from 'three';
import {createUpgradedRaceGround} from '../lib/game/upgraded-race-ground.ts';
import {createUpgradedRetroLighting} from '../lib/game/upgraded-retro-lighting.ts';
import {createCompleteUpgradedCarModel} from '../lib/game/complete-upgraded-car-model.ts';
import {setUpgradedCarPresentationPose,upgradedCarGroundingOffset} from '../lib/game/upgraded-car-grounding.ts';
import {setUpgradedCarGroundContactPanels} from '../lib/game/upgraded-car-materials.ts';
import assetsData from '../public/game/assets.json';
import palette from '../public/game/track-materials.json';
import type {Assets} from '../lib/game/types.ts';

/** Browser GPU regression. Bundle this module and call the exported function
 * in a WebGL2 browser; it uses the real car, ground, depth peel and filters.
 * No readbacks or diagnostic hooks are installed in the production renderer. */
export function verifyUpgradedGroundShadows(){
 const check=(value:boolean,message:string)=>{if(!value)throw Error(message);};
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,logarithmicDepthBuffer:true,preserveDrawingBuffer:true});renderer.setSize(320,240);
 const scene=new THREE.Scene(),world=new THREE.Group();world.scale.z=-1;scene.add(world);
 const ground=createUpgradedRaceGround();ground.material.color.setHex(0x27641d);world.add(ground);
 const assets=assetsData as unknown as Assets,{car0,car1}=assets.shapes.STPMIN;
 const {model:indy,sourceScale}=createCompleteUpgradedCarModel(car0,car1,0xffffff,{...palette,paint:0,paletteMaterial:46});let model=indy;model.scale.setScalar(400/sourceScale);world.add(model);
 const lighting=createUpgradedRetroLighting();lighting.apply(model,false);lighting.apply(world);
 const camera=new THREE.PerspectiveCamera(45,4/3,1,200000),gl=renderer.getContext();
 const deck=new THREE.Mesh(new THREE.PlaneGeometry(512,512),new THREE.MeshBasicMaterial({color:0x888888,side:THREE.DoubleSide,toneMapped:false}));deck.rotation.x=-Math.PI/2;deck.visible=false;world.add(deck);lighting.apply(deck);
 let casterTarget:THREE.WebGLRenderTarget|undefined,coverageTarget:THREE.WebGLRenderTarget|undefined;
 const render=renderer.render.bind(renderer);
 renderer.render=(renderScene,view)=>{
  const target=renderer.getRenderTarget();
  if(target?.width===512){
   if(target.texture.type===THREE.UnsignedByteType)casterTarget=target;
   else if(renderScene instanceof THREE.Scene&&renderScene.overrideMaterial)coverageTarget=target;
  }
  render(renderScene,view);
 };
 const readColour=()=>{const result=new Uint8Array(gl.drawingBufferWidth*gl.drawingBufferHeight*4);gl.readPixels(0,0,gl.drawingBufferWidth,gl.drawingBufferHeight,gl.RGBA,gl.UNSIGNED_BYTE,result);return result;};
 const capture=(casts:boolean,showCar=true,showDeck=deck.visible)=>{
  model.visible=true;lighting.drawShadows(renderer,casts?[model]:[],scene);
  const deckVisible=deck.visible;model.visible=showCar;deck.visible=showDeck;renderer.render(scene,camera);
  const result=readColour();model.visible=true;deck.visible=deckVisible;return result;
 };
 const darkPixels=(plain:Uint8Array,shadow:Uint8Array)=>{let count=0;for(let at=0;at<plain.length;at+=4)if(Math.max(plain[at]-shadow[at],plain[at+1]-shadow[at+1],plain[at+2]-shadow[at+2])>2)count++;return count;};
 const mapCounts=()=>{
  check(!!casterTarget&&!!coverageTarget,'real caster and filtered receiver passes must both run');
  const caster=new Uint8Array(512*512*4),coverage=new Float32Array(512*512*4);
  renderer.readRenderTargetPixels(casterTarget!,0,0,512,512,caster);renderer.setRenderTarget(coverageTarget!);gl.readPixels(0,0,512,512,gl.RGBA,gl.FLOAT,coverage);renderer.setRenderTarget(null);
  check(gl.getError()===gl.NO_ERROR,'GPU map readback failed');
  let casterPixels=0,coveragePixels=0;for(let at=0;at<caster.length;at+=4){if(caster[at+3]>127)casterPixels++;if(coverage[at]>.1||coverage[at+1]>.1)coveragePixels++;}
  return {casterPixels,coveragePixels};
 };
 const place=(x:number,z:number,y=8)=>{setUpgradedCarPresentationPose(model,[x,y,z],[128,0,0],upgradedCarGroundingOffset(car1));camera.position.set(x+200,y+492,-z+400);camera.lookAt(x,y,-z);};
 const results=[];
 try{
  check(renderer.extensions.has('EXT_color_buffer_float'),'GPU regression requires float colour-buffer support');
  for(const [x,z] of [[5000,5000],[25000,5000],[5000,25000],[25000,25000],[30780,15000],[-100,15000],[15000,30780],[15000,-100],[-32768,32767],[32767,-32768]]){
   place(x,z);const plain=capture(false),shadow=capture(true),maps=mapCounts(),darkened=darkPixels(plain,shadow);
   check(maps.casterPixels>1000,`missing Indy caster at ${x}/${z}`);check(maps.coveragePixels>1000,`missing grass receiver at ${x}/${z}`);check(darkened>20,`missing visible grass shadow at ${x}/${z}`);
   results.push({x,z,...maps,darkened});
  }
  place(30780,15000,458);deck.position.set(30780,450,15000);deck.visible=true;
  const deckDarkened=darkPixels(capture(false),capture(true));check(deckDarkened>20,'elevated deck must receive the car shadow');
  const groundLeak=darkPixels(capture(false,false,false),capture(true,false,false));check(groundLeak===0,'deck shadow must not leak onto the ground beneath it');
  deck.visible=false;renderer.setSize(320,200);
  // Captured native helicopter projection, including its non-square pixels
  // and the dashboard's off-centre horizon (cx=160, cy=69, fx=230, fy=163).
  camera.projectionMatrix.makePerspective(-160/230,160/230,69/163,-131/163,1,200000);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  const visibility=[];
  for(const heading of Array.from({length:16},(_,i)=>i*64))for(const y of [6,7,8,9,10]){
   setUpgradedCarPresentationPose(model,[15000,y,15000],[heading,y-8,(y-8)*2],upgradedCarGroundingOffset(car1));
   camera.position.set(14695,y+270,-14668);camera.lookAt(15000,y,-15000);
   const a=capture(false),b=capture(true),darkened=darkPixels(a,b);
   check(darkened>=40,`grass silhouette becomes too obscured at helicopter heading ${heading}, height ${y}: ${darkened} pixels`);
   visibility.push({heading,y,darkened});
  }
  const cameras=[];
  for(const [name,offset] of [['follow',[-54,98,178]],['trackside',[-1500,250,1000]]] as const)for(const heading of [0,256,512,768])for(const y of [6,8,10]){
   setUpgradedCarPresentationPose(model,[15000,y,15000],[heading,0,(y-8)*2],upgradedCarGroundingOffset(car1));
   camera.position.set(15000+offset[0],y+offset[1],-15000+offset[2]);camera.lookAt(15000,y,-15000);
   const darkened=darkPixels(capture(false),capture(true));check(darkened>0,`missing ${name} shadow at heading ${heading}, height ${y}`);cameras.push({name,heading,y,darkened});
  }
  place(15000,15000,8);deck.position.set(15000,0,15000);deck.visible=true;
  const roadDarkened=darkPixels(capture(false),capture(true));check(roadDarkened>20,'road surface must retain its car shadow');
  deck.visible=false;place(15000,15000,40);
  const jumpDarkened=darkPixels(capture(false),capture(true));check(jumpDarkened>20,'a rising car must still cast onto grass');
  // car1's rollover floor extends past car0's front wing. It faces down and
  // must not make a ground shadow from above, even while suspension crosses
  // the receiving plane. Do not delete that authored floor to achieve this.
  camera.position.set(15000,500,-15000);camera.up.set(0,0,1);camera.lookAt(15000,0,-15000);camera.updateMatrixWorld();
  const probe=new THREE.Vector3(15000,-1,-15053).project(camera),probeAt=(Math.round((probe.y+1)*100)*320+Math.round((probe.x+1)*160))*4;
  const ghost=[];
  for(const y of [6,6.5,7,7.5,8,8.5,9,10]){
   setUpgradedCarPresentationPose(model,[15000,y,15000],[0,0,0],upgradedCarGroundingOffset(car1));
   const plain=capture(false),shadow=capture(true),difference=Math.max(...[0,1,2].map(channel=>plain[probeAt+channel]-shadow[probeAt+channel]));
   check(difference<=2,`invisible Indy floor casts a blinking front rectangle at height ${y}`);ghost.push({y,difference});
  }
  camera.up.set(0,1,0);model.visible=false;
  const cars=[];
  for(const car of assets.cars){
   const shapes=assets.shapes['ST'+car.id],built=createCompleteUpgradedCarModel(shapes.car0,shapes.car1,0xffffff,{...palette,paint:0,paletteMaterial:46});model=built.model;model.scale.setScalar(400/built.sourceScale);world.add(model);lighting.apply(model,false);
   setUpgradedCarGroundContactPanels(model,true);
   for(const [view,offset] of [['helicopter',[-305,270,332]],['follow',[-54,98,178]],['trackside',[-1500,250,1000]]] as const)for(const heading of [0,256,512,768])for(const y of [6,8,10]){
    setUpgradedCarPresentationPose(model,[15000,y,15000],[heading,y-8,(y-8)*2],upgradedCarGroundingOffset(shapes.car1));camera.position.set(15000+offset[0],y+offset[1],-15000+offset[2]);camera.lookAt(15000,y,-15000);
    const darkened=darkPixels(capture(false),capture(true));check(darkened>0,`${car.name} loses its ${view} shadow at heading ${heading}, height ${y}`);cars.push({car:car.id,view,heading,y,darkened});
   }
   setUpgradedCarPresentationPose(model,[15000,458,15000],[128,0,0],upgradedCarGroundingOffset(shapes.car1));camera.position.set(14695,728,-14668);camera.lookAt(15000,458,-15000);deck.position.set(15000,450,15000);deck.visible=true;
   check(darkPixels(capture(false),capture(true))>0,`${car.name} loses its bridge shadow`);
   check(darkPixels(capture(false,false,false),capture(true,false,false))===0,`${car.name} bridge shadow leaks onto lower grass`);
   setUpgradedCarPresentationPose(model,[15000,8,15000],[128,0,0],upgradedCarGroundingOffset(shapes.car1));camera.position.set(14695,278,-14668);camera.lookAt(15000,8,-15000);deck.position.y=0;
   check(darkPixels(capture(false),capture(true))>0,`${car.name} loses its road shadow`);deck.visible=false;
   setUpgradedCarPresentationPose(model,[15000,40,15000],[128,4,4],upgradedCarGroundingOffset(shapes.car1));camera.position.set(14695,310,-14668);camera.lookAt(15000,40,-15000);
   check(darkPixels(capture(false),capture(true))>0,`${car.name} loses its airborne shadow`);
   model.visible=false;
  }
  return {grass:results,bridge:{darkened:deckDarkened,groundLeak},road:{darkened:roadDarkened},jump:{darkened:jumpDarkened},visibility,cameras,ghost,cars};
 }finally{
  lighting.dispose();scene.traverse(node=>{if(node instanceof THREE.Mesh){node.geometry.dispose();for(const material of Array.isArray(node.material)?node.material:[node.material])material.dispose();}});renderer.dispose();renderer.forceContextLoss();
 }
}
