import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PerspectiveCamera,Vector3} from 'three';
import {createEnhancedChaseCamera} from '../lib/game/enhanced-chase-camera.ts';
import {readUpgradedCarPose,upgradedSourceCamera} from '../lib/game/upgraded-source-camera.ts';
import {createLiveGraphicsMotion} from '../lib/game/live-graphics-motion.ts';
import {originalExternalCameraClearance} from '../lib/game/external-camera-clearance.ts';
import {originalExternalCameraAngles} from '../lib/game/external-camera-angles.ts';
import {upgradedCameraBasis} from '../lib/game/upgraded-camera-basis.ts';
import {upgradedBackgroundView,upgradedBackgroundHeight} from '../lib/game/upgraded-background-view.ts';
import {backgroundCamera,createNativeBackground,nativePanoramaHorizon} from '../lib/game/native-background.ts';
import {enhancedPanoramaLeft} from '../lib/game/enhanced-alpine-background.ts';
import {distantCloudPlacement} from '../lib/game/upgraded-world-visibility.ts';
import {drawOriginalSceneBackground} from '../lib/game/render-scene-background.ts';
import {projectOriginalVector} from '../lib/game/project-original-vector.ts';
import {rotateZXY} from '../lib/physics/rotation.ts';
import {vecTransform,type Vector} from '../lib/physics/math.ts';
import type {RenderPose} from '../lib/game/render-pose.ts';

const json=(name:string)=>JSON.parse(readFileSync(new URL(`../public/game/${name}.json`,import.meta.url),'utf8'));
const track={raw:Array(1802).fill(0),objects:json('track-objects'),planes:json('collision-planes')};
const pose=(x:number,z:number,yaw=0):RenderPose=>({position:[x,8,z],rotation:[yaw,0,0]});
const near=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} != ${expected}`);
const delta=(a:number,b:number)=>((a-b+512)%1024+1024)%1024-512;

for(const level of [1,2,3] as const)await test(`chase ${level}: slow car and eye retain identical sub-unit translation at 60/120/240 Hz`,()=>{
 for(const rate of [60,120,240]){
  const rig=createEnhancedChaseCamera(track);let initial:Vector|undefined;
  for(let sample=0;sample<rate*2;sample++){
   const now=1000+sample*1000/rate,car=pose(15000+sample*.017,15000+sample*.071);
   const view=rig.sample(car,level,0,now,Math.floor(sample*20/rate)+1,0);
   const relative=view.position.map((n,i)=>n-(i===2?-car.position[i]:car.position[i])) as Vector;
   initial??=relative;relative.forEach((value,i)=>near(value,initial![i]));
  }
 }
});

await test('fractional chase eye retains native terrain clearance corrections',()=>{
 const raised={...track,raw:[...track.raw]};raised.raw.fill(6,901,1801);
 const car=pose(15000.23,15000.67),view=createEnhancedChaseCamera(raised).sample(car,1,0,1000,1,0);
 const desired:Vector=[car.position[0],car.position[1]+76,car.position[2]-210];
 const rounded=desired.map(Math.round) as Vector,cleared=originalExternalCameraClearance(rounded,raised.raw,raised.objects,raised.planes);
 assert.ok(cleared[1]>rounded[1]);
 view.position.forEach((value,i)=>near(i===2?-value:value,desired[i]+cleared[i]-rounded[i]));
});

await test('enhanced car endpoints match the native six-bit-shift submission origin',()=>{
 const memory=new DataView(new ArrayBuffer(64));
 for(const values of [[960015,512,960043],[-1,-65,-128],[2000000,36000,999999]]){
  values.forEach((value,i)=>memory.setInt32(i*4,value,true));
  [1023,-20,16].forEach((value,i)=>memory.setInt16(24+i*2,value,true));
  assert.deepEqual(readUpgradedCarPose(memory,0),{position:values.map(value=>value>>6),rotation:[1023,-20,16]});
 }
});

const fixtures:RenderPose[]=[
 {position:[15000,70,14500],rotation:[0,0,0]},
 {position:[14950,270,14700],rotation:[0,960,64]},
 {position:[15100,540,15200],rotation:[0,36,256]},
 {position:[15000,700,14800],rotation:[64,128,1020]},
 {position:[15000,180,14800],rotation:[0,256,512]},
];
for(const mode of ['cockpit','helicopter','orbit','TV'])await test(`${mode}: source camera endpoints and track projection retain native composition`,()=>{
 for(const source of fixtures){
  const motion=createLiveGraphicsMotion(),value={camera:source,cars:[pose(15000,15000)]};
  const shown=motion.sample(value,10,mode,true,1000,mode==='TV');
  assert.deepEqual(shown.camera,source);
  const view=upgradedSourceCamera(shown.camera);
  assert.deepEqual(view.position,[source.position[0],source.position[1],-source.position[2]]);
  const camera=new PerspectiveCamera();camera.position.set(...view.position);camera.up.set(...view.up);camera.lookAt(...view.target);camera.updateMatrixWorld();
  camera.projectionMatrix.makePerspective(-160/200,160/200,100/160,-100/160,1,200000);
  const basis=upgradedCameraBasis(source.rotation),right=new Vector3(...basis.up).cross(new Vector3(...basis.forward));
  for(const [x,y] of [[0,0],[50,30],[-50,-30]]){
   const offset=new Vector3(...basis.forward).multiplyScalar(800).addScaledVector(right,x).addScaledVector(new Vector3(...basis.up),y).toArray().map(Math.round) as Vector;
   const native=projectOriginalVector(vecTransform(offset,rotateZXY(...source.rotation,true)),[160,100],[200,160]);
   const point=new Vector3(source.position[0]+offset[0],source.position[1]+offset[1],-source.position[2]-offset[2]).project(camera);
   // The native raster rounds vertices to source pixels; GPU projection
   // preserves subpixel precision within that same pixel cell.
   assert.ok(Math.abs((point.x+1)*160-native[0])<1.1);
   assert.ok(Math.abs((1-point.y)*100-native[1])<1.1);
  }
 }
});

await test('TV background follows native camera framing within source raster rounding',()=>{
 const memory=new Uint8Array(readFileSync(new URL('../public/game/native-resource-base.bin',import.meta.url))),data=new DataView(memory.buffer),d=0x2d1a0;
 const projection=[160,100,200,160];projection.forEach((value,i)=>data.setInt16(d+0x4b88+i*2,value,true));
 const renderer=createNativeBackground(memory),eye:Vector=[14950,270,14700];
 let previousHorizon:number|undefined;
 for(const car of [[15000,8,15000],[15000,8,16000],[15100,16,17000]] as Vector[]){
  const a=originalExternalCameraAngles(car,eye),angles:Vector=[0,a.pitch,a.heading];
  const view=upgradedBackgroundView(angles),height=upgradedBackgroundHeight(false,3,eye[1]);
  assert.deepEqual(view.angles,angles);assert.equal(height,eye[1]);
  let nativeHorizon:number|undefined;
  const matrix=rotateZXY(0,angles[1],0,true);
  drawOriginalSceneBackground(memory,d,[0,320,0,200],1,matrix,0,angles[2],height,{fill(){},polygon(){},panorama(_rectangle,_heading,horizon){nativeHorizon=horizon;}});
  const shown=renderer.render(view.angles,height,4/3,58,projection,0);
  assert.ok(Math.abs(shown.panoramaHorizon!-nativeHorizon!)<1.1);assert.notEqual(nativeHorizon,previousHorizon);previousHorizon=nativeHorizon;
 }
 for(const source of fixtures){
  const background=upgradedBackgroundView(source.rotation);
  assert.deepEqual(background.angles,[0,source.rotation[1],source.rotation[2]],'panorama projection keeps source pitch and heading');
  near(background.rotation,source.rotation[0]===0?0:-source.rotation[0]*Math.PI/512);
  assert.equal(upgradedBackgroundHeight(false,0,source.position[1]),source.position[1]);
 }
 const before:Vector=[0,997,1018],after:Vector=[0,998,1019];
 const a=nativePanoramaHorizon(before,270,projection)!,b=nativePanoramaHorizon(after,270,projection)!;
 for(const fraction of [0,.125,.25,.5,.75,1]){
  const horizon=nativePanoramaHorizon([0,997+fraction,1018+fraction],270,projection)!;
  assert.ok(horizon>=a&&horizon<=b);
  near(enhancedPanoramaLeft(1018+fraction),enhancedPanoramaLeft(1018)+fraction);
 }
});

for(const mode of ['cockpit','helicopter','orbit','TV'])for(const rate of [60,120,240])await test(`${mode}: panorama follows continuous world projection without pixel steps at ${rate} Hz`,()=>{
 const projection=[160,mode==='cockpit'?65:100,230,155],view=new PerspectiveCamera();
 view.projectionMatrix.makePerspective(-projection[0]/projection[2],(320-projection[0])/projection[2],projection[1]/projection[3],-(200-projection[1])/projection[3],1,200000);
 let last:number|undefined;
 for(let i=0;i<=rate;i++){
  // A TV eye stays fixed while it aims at a jumping car; following cameras
  // also translate vertically. Keep both paths below the viewport clipping.
  const camera:RenderPose={position:[15000,mode==='TV'?270:70+450*i/rate,15000],rotation:[0,mode==='TV'?5*i/rate:0,0]};
  const source=upgradedSourceCamera(camera);view.position.set(...source.position);view.up.set(...source.up);view.lookAt(...source.target);view.updateMatrixWorld();
  const groundPoint=new Vector3(15000,0,-30000).project(view),expected=(1-groundPoint.y)*100;
  const horizon=nativePanoramaHorizon(camera.rotation,camera.position[1],projection)!;
  near(horizon,expected);
  if(last!==undefined){assert.ok(horizon>last,'every moving display frame must move the horizon');assert.ok(horizon-last<6/rate,'no one-source-pixel threshold jumps');}
  last=horizon;
 }
});

for(const rate of [60,120,240])await test(`native helicopter startup dolly remains smooth at ${rate} Hz with irregular arrivals`,()=>{
 // Captured native startup frames 6..9. The projection stays constant:
 // the apparent zoom is a dolly, not a change in focal length.
 const heights=[780,750,720,690],pitches=[993,994,994,994],times=[0,50,250/3,400/3];
 const projection=[160,100,230,155],motion=createLiveGraphicsMotion();
 const value=(i:number)=>({camera:{position:[15000,heights[i],15000] as Vector,rotation:[0,pitches[i],0] as Vector},cars:[pose(15000,15000)]});
 const view=new PerspectiveCamera();view.projectionMatrix.makePerspective(-160/230,160/230,100/155,-100/155,1,200000);
 let index=0;
 for(let sample=0;sample<=Math.ceil(200*rate/1000);sample++){
  const now=sample*1000/rate;
  if(index+1<times.length&&now+1e-7>=times[index+1])index++;
  const shown=motion.sample(value(index),index,'1',false,now).camera,source=upgradedSourceCamera(shown);
  view.position.set(...source.position);view.up.set(...source.up);view.lookAt(...source.target);view.updateMatrixWorld();
  const expected=(1-new Vector3(15000,0,-30000).project(view).y)*100;
  near(nativePanoramaHorizon(shown.rotation,shown.position[1],projection)!,expected);
 }
});

await test('banked source view keeps the enhanced panorama eligible and rolls it with the camera',()=>{
 const source:Vector=[24,7,1010],view=upgradedBackgroundView(source);
 assert.equal(view.angles[0],0);
 assert.notEqual(nativePanoramaHorizon(view.angles,270,[160,100,200,160]),undefined);
 near(view.rotation,-source[0]*Math.PI/512);
});

await test('continuous panorama retains native visible framing, angle wrap and clipping',()=>{
 const memory=new Uint8Array(readFileSync(new URL('../public/game/native-resource-base.bin',import.meta.url))),data=new DataView(memory.buffer),d=0x2d1a0;
 const projection=[160,100,230,155];projection.forEach((value,i)=>data.setInt16(d+0x4b88+i*2,value,true));
 for(let pitch=-100;pitch<=100;pitch++)for(let height=0;height<2000;height+=37){
  const angles:Vector=[0,pitch&1023,0],matrix=rotateZXY(...angles,true);
  let original:number|undefined;
  drawOriginalSceneBackground(memory,d,[0,320,0,200],1,matrix,0,0,height,{fill(){},polygon(){},panorama(_rectangle,_heading,horizon){original=horizon;}});
  const shown=nativePanoramaHorizon(angles,height,projection)!;
  if(original!==undefined&&Math.max(original,shown)<=200)assert.ok(Math.abs(shown-original)<1.1,'same source geometry, differing only within integer raster rounding');
 }
 near(nativePanoramaHorizon([0,1023.75,0],270,projection)!,nativePanoramaHorizon([0,-.25,0],270,projection)!);
 assert.equal(nativePanoramaHorizon([0,256,0],0,projection),undefined);
 assert.equal(nativePanoramaHorizon([0,512,0],0,projection),undefined);
 assert.equal(nativePanoramaHorizon([0,900,0],0,projection,9),9);
});

for(const level of [1,2,3] as const)await test(`V ${level}: bridges cannot translate the panorama or clouds`,()=>{
 for(const rate of [60,120,240]){
  const rig=createEnhancedChaseCamera(track);let initialHorizon:number|undefined,initialCloudHeight:number|undefined;
  for(let sample=0;sample<rate*3;sample++){
   const at=sample*1000/rate,frame=Math.floor((at+1e-7)/50),height=8+Math.min(673,frame*12);
   const car={...pose(15000,15000),position:[15000,height,15000] as Vector};
   const chase=rig.sample(car,level,0,1000+at,frame+1,0);
   const angles=backgroundCamera(chase.position,chase.target,chase.up,true).angles;
   const reference=upgradedBackgroundHeight(true,0,chase.position[1]);
   const horizon=nativePanoramaHorizon(upgradedBackgroundView(angles).angles,reference,[160,100,200,160])!;
   const camera=[chase.position[0],chase.position[1],-chase.position[2]] as Vector;
   const cloud=distantCloudPlacement(128,camera,reference),cloudHeight=cloud.position[1]-camera[1];
   initialHorizon??=horizon;initialCloudHeight??=cloudHeight;
   near(horizon,initialHorizon);near(cloudHeight,initialCloudHeight);
  }
 }
});

await test('native TV site cuts and paused replay remain immediate',()=>{
 const motion=createLiveGraphicsMotion(),first={camera:fixtures[0],cars:[pose(15000,15000)]};
 motion.sample(first,10,'3',false,1000,true);
 const next={camera:fixtures[1],cars:[pose(15001,15003)]};
 assert.deepEqual(motion.sample(next,11,'3',false,1050,true).cars,next.cars);
 assert.deepEqual(motion.sample(first,5,'3',true,1060,true).camera,first.camera);
});

for(const level of [1,2,3] as const)await test(`V ${level}: body, wheel steering and panorama stay smooth through slalom, yaw wrap and hidden native cuts`,()=>{
 for(const rate of [60,120,240]){
  const cutMotion=createLiveGraphicsMotion(),controlMotion=createLiveGraphicsMotion(),cutRig=createEnhancedChaseCamera(track),controlRig=createEnhancedChaseCamera(track);
  let oldBody:number|undefined,oldSteering:number|undefined,oldHeading:number|undefined,bodyMoved=0,wheelsMoved=0,fractionalHeadings=0;
  for(let sample=0;sample<rate*4;sample++){
   const at=sample*1000/rate,frame=Math.floor((at+1e-7)/50),yaw=(1018+Math.round(frame*.75+6*Math.sin(frame/8)))&1023;
   const car=pose(15000+frame*.25,15000+frame*.5,yaw),steering=Math.round(50*Math.sin(frame/8));
   const value={camera:fixtures[0],cars:[car],steering:[steering]};
   const cutValue={...value,camera:fixtures[Math.floor(frame/10)%fixtures.length]};
   const shown=cutMotion.sample(cutValue,frame+1,'3',false,1000+at,true,true);
   const control=controlMotion.sample(value,frame+1,'3',false,1000+at,true,true);
   assert.deepEqual(shown.cars,control.cars);assert.deepEqual(shown.steering,control.steering);
   const view=cutRig.sample(shown.cars[0],level,0,1000+at,frame+1,0,shown.steering![0]),reference=controlRig.sample(control.cars[0],level,0,1000+at,frame+1,0,control.steering![0]);
   assert.deepEqual(view,reference,'hidden camera cuts cannot add lag or change chase yaw');
   const heading=backgroundCamera(view.position,view.target,view.up,true).angles[2];
   if(Math.abs(heading-Math.round(heading))>1e-6)fractionalHeadings++;
   if(oldBody!==undefined){assert.ok(Math.abs(delta(shown.cars[0].rotation[0],oldBody))<=2);if(delta(shown.cars[0].rotation[0],oldBody)!==0)bodyMoved++;}
   if(oldSteering!==undefined){assert.ok(Math.abs(shown.steering![0]-oldSteering)<9);if(shown.steering![0]!==oldSteering)wheelsMoved++;}
   if(oldHeading!==undefined)assert.ok(Math.abs(delta(heading,oldHeading))<2);
   oldBody=shown.cars[0].rotation[0];oldSteering=shown.steering![0];oldHeading=heading;
  }
  assert.ok(bodyMoved>rate);assert.ok(wheelsMoved>rate);assert.ok(fractionalHeadings>rate);
 }
});
