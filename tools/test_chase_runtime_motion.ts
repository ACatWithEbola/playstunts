import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3,Quaternion} from 'three';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createNativeResourceCatalog} from '../lib/game/native-resource-catalog.ts';
import {readUpgradedCarPose} from '../lib/game/upgraded-source-camera.ts';
import {createLiveGraphicsMotion} from '../lib/game/live-graphics-motion.ts';
import {createEnhancedChaseCamera,enhancedChaseNeedsTransporterCutaway,ENHANCED_CHASE_CAMERA_PRESETS} from '../lib/game/enhanced-chase-camera.ts';
import {backgroundCamera} from '../lib/game/native-background.ts';
import {upgradedCameraBasis} from '../lib/game/upgraded-camera-basis.ts';
import {createCompleteUpgradedCarModel} from '../lib/game/complete-upgraded-car-model.ts';
import {createUpgradedCarWheelMotion} from '../lib/game/upgraded-car-wheels.ts';
import {CHASE_TURN_REVEAL,CHASE_TURN_RESPONSE,createChaseTurnOffset} from '../lib/game/chase-turn-offset.ts';

const root=new URL('../public/game/',import.meta.url),json=(name:string)=>JSON.parse(readFileSync(new URL(name+'.json',root),'utf8'));
const assets=json('assets'),objects=json('track-objects'),planes=json('collision-planes');
const catalog=createNativeResourceCatalog(json('original-resources/manifest').files,async file=>new Uint8Array(readFileSync(new URL('original-resources/'+file,root))));
const configuration=Array(24).fill(0);configuration.splice(0,4,...Buffer.from('COUN'));configuration[5]=1;configuration[7]=255;configuration.splice(13,7,...Buffer.from('DEFAULT'));
const track=assets.tracks.find((t:{name:string})=>t.name==='DEFAULT');
const runtime=await createNativeManualRaceRuntime({base:new Uint8Array(readFileSync(new URL('native-resource-base.bin',root))),catalog,cars:assets.cars,records:json('route-records'),vectors:json('route-vectors'),samples:json('route-sample-vectors'),objects,points:json('route-point-vectors'),indices:json('route-speed-indices'),planes,walls:json('collision-walls').walls},{configuration,track:track.raw,name:'DEFAULT',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
runtime.enableGraphicsCapture();
let mask=1;
const controls={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>mask,keyDown:()=>0};
const snapshots:{frame:number;pose:ReturnType<typeof readUpgradedCarPose>;steering:number;camera:{position:[number,number,number];rotation:[number,number,number]};mask:number}[]=[];
const d=0x2d1a0;
for(let step=0;step<450;step++){
 const m=runtime.session.state.memory,v=new DataView(m.buffer,m.byteOffset,m.byteLength),frame=v.getUint16(d+0x8c26,true);
 mask=frame<25?1:frame<85?8:frame<145?4:frame<185?8:0;
 for(let tick=0;tick<5;tick++)runtime.tick(controls);
 runtime.renderCockpitWorld();const graphics=runtime.graphicsFrame()!;runtime.finishRenderedFrame();
 const data=new DataView(graphics.memory.buffer,graphics.memory.byteOffset,graphics.memory.byteLength),next=data.getUint16(d+0x8c26,true);
 if(graphics.memory[d+0xa3c2]===0&&next&&snapshots.at(-1)?.frame!==next)snapshots.push({frame:next,pose:readUpgradedCarPose(data,d+0x8c38),steering:data.getInt16(d+0x8c58,true),camera:{position:graphics.position,rotation:graphics.angles},mask});
}
const delta=(a:number,b:number)=>((a-b+512)%1024+1024)%1024-512;
await test('V chase starts with the requested close framing and steps outward gradually',()=>{
 const close=ENHANCED_CHASE_CAMERA_PRESETS[1],standard=ENHANCED_CHASE_CAMERA_PRESETS[2],far=ENHANCED_CHASE_CAMERA_PRESETS[3];
 assert.deepEqual([close.distance,standard.distance,far.distance],[150,175,225]);
 assert.deepEqual([close.fov,standard.fov,far.fov],[54,56,58]);
 assert.ok(close.height<standard.height&&standard.height<far.height);
 assert.ok(close.lookAhead<standard.lookAhead&&standard.lookAhead<far.lookAhead);
 assert.ok(standard.distance-close.distance<=50&&far.distance-standard.distance<=50,'zoom levels must stay close enough to feel like gradual steps');
 const downwardAngles=[close,standard,far].map(rig=>Math.atan2(rig.height-rig.targetHeight,rig.distance+rig.lookAhead)*180/Math.PI);
 [2.5,2.7,3].forEach((expected,index)=>assert.ok(Math.abs(downwardAngles[index]-expected)<0.01,`V ${index+1} pitch must remain ${expected} degrees`));
});
await test('all three V chase levels use the transporter cutaway during rollout',()=>{
 for(const level of [1,2,3] as const)assert.equal(enhancedChaseNeedsTransporterCutaway(level,true,0,false),true);
 assert.equal(enhancedChaseNeedsTransporterCutaway(0,true,0,true),false);
 assert.equal(enhancedChaseNeedsTransporterCutaway(3,true,1,true),true);
 assert.equal(enhancedChaseNeedsTransporterCutaway(3,true,1,false),false);
});
await test('native reproduction includes sustained left/right input and actual yaw-increment variation',()=>{
 assert.ok(snapshots.length>160);
 assert.ok(snapshots.some(sample=>sample.steering===-240));
 assert.ok(snapshots.some(sample=>sample.steering===240));
 const increments=new Set(snapshots.flatMap((sample,i)=>sample.frame>=60&&sample.frame<80?[delta(sample.pose.rotation[0],snapshots[i-1].pose.rotation[0])]:[]));
 assert.ok(increments.has(5)&&increments.has(6),'actual varying native yaw increments must be present, not a synthetic constant-speed turn');
});
const runtimeOffsets=new Map<string,number[]>();
for(const rate of [60,120,240])for(const level of [1,2,3] as const)await test(`native slalom at ${rate} Hz, V ${level}: stable turn reveal without car/chase rocking`,()=>{
 const motion=createLiveGraphicsMotion(),rig=createEnhancedChaseCamera({raw:track.raw,objects,planes});
 const view=new PerspectiveCamera(),yAxis=new Vector3(0,1,0);
 const shapes=assets.shapes.STCOUN,model=createCompleteUpgradedCarModel(shapes.car0,shapes.car1,0xffffff,{paint:0,...json('track-materials')}).model;
 const wheels=createUpgradedCarWheelMotion(shapes.car0,model,20);
 const tires=model.children.filter(node=>node.userData.originalWheelPart==='tire');
 wheels.update(undefined,0);const wheelBases=tires.map(node=>node.quaternion.clone());
 const wheelPrimitives=shapes.car0.primitives.filter((primitive:{type:number})=>primitive.type===12);
 let lastIndex=-1,sourceAt=0,lastOffset=0,maxLeft=0,maxRight=0;
 const offsets:number[]=[];
 const before=JSON.stringify(snapshots);
 for(let i=0;i<Math.floor(snapshots.length*rate/20);i++){
  const time=i*1000/rate,index=Math.min(snapshots.length-1,Math.floor((time+1e-7)/50)),sample=snapshots[index];
  if(index!==lastIndex){sourceAt=time;lastIndex=index;}
  const shown=motion.sample({camera:sample.camera,cars:[sample.pose],steering:[sample.steering]},sample.frame,'0',false,time,false,true);
  const camera=rig.sample(shown.cars[0],level,0,time,sample.frame,0,shown.steering![0]),heading=backgroundCamera(camera.position,camera.target,camera.up,true).angles[2];
  const error=delta(shown.cars[0].rotation[0],heading);
  assert.ok(Math.abs(error+camera.turnOffset*512/Math.PI)<1e-8,`frame ${sample.frame}: native yaw increments must not add another heading error`);
  assert.ok(Math.abs(camera.turnOffset)<=CHASE_TURN_REVEAL+1e-10);
  if(sample.frame>=35&&sample.frame<80)assert.ok(camera.turnOffset<=lastOffset+1e-10,'held left input must settle monotonically despite irregular body yaw');
  lastOffset=camera.turnOffset;
  if(i%(rate/60)===0)offsets.push(camera.turnOffset);
  // Test the visible consequence as well as the heading: the projected nose
  // reveals the appropriate side, without an independent camera/body wobble.
  view.position.set(...camera.position);view.up.set(...camera.up);view.lookAt(...camera.target);view.fov=camera.fov;view.aspect=4/3;view.updateProjectionMatrix();view.updateMatrixWorld();
  const car=shown.cars[0],basis=upgradedCameraBasis([car.rotation[2],car.rotation[1],car.rotation[0]]);
  const center=new Vector3(car.position[0],car.position[1],-car.position[2]);
  const nose=center.clone().addScaledVector(new Vector3(basis.forward[0],basis.forward[1],-basis.forward[2]),60);
  const reveal=nose.project(view).x-center.project(view).x;
  if(camera.turnOffset<-.1)maxLeft=Math.max(maxLeft,-reveal);
  if(camera.turnOffset>.1)maxRight=Math.max(maxRight,reveal);
  if(Math.abs(camera.turnOffset)>.01)assert.equal(Math.sign(reveal),Math.sign(camera.turnOffset),'side reveal follows the turn direction');
  const previous=snapshots[Math.max(0,index-1)],fraction=Math.min(1,(time-sourceAt)/50);
  const steering=previous.steering+(sample.steering-previous.steering)*fraction;
  assert.ok(Math.abs(shown.steering![0]-steering)<1e-8,'steering follows the same source-time blend as the body');
  wheels.update(undefined,shown.steering![0]);
  tires.forEach((wheel,wheelIndex)=>{
   const front=wheelPrimitives[wheelIndex].indices.every((vertex:number)=>vertex>=8&&vertex<20);
   const expected=new Quaternion().setFromAxisAngle(yAxis,front?steering*Math.PI/1024:0).multiply(wheelBases[wheelIndex]);
   assert.ok(1-Math.abs(wheel.quaternion.dot(expected))<1e-10,'wheel pose remains the exact signed steering rotation, without another follower');
  });
 }
 assert.ok(maxLeft>.025&&maxRight>.025,'both turn directions must visibly reveal the car side');
 runtimeOffsets.set(`${rate}/${level}`,offsets);
 assert.equal(JSON.stringify(snapshots),before,'enhanced presentation must not mutate native simulation snapshots');
 model.traverse(node=>{if('geometry' in node)(node.geometry as {dispose():void}).dispose();});
});

await test('native turn reveal agrees at shared timestamps across all V levels and 60/120/240 Hz',()=>{
 const baseline=runtimeOffsets.get('60/1')!;
 for(const values of runtimeOffsets.values())values.forEach((value,i)=>assert.ok(Math.abs(value-baseline[i])<1e-9));
});

await test('critically damped turn offset is bounded, symmetric and has an exact non-oscillating step response',()=>{
 for(const rate of [60,120,240]){
  const left=createChaseTurnOffset(),right=createChaseTurnOffset();
  left.sample(-240,0);right.sample(240,0);let previous=0;
  for(let i=1;i<=rate*3;i++){
   const t=i/rate,l=left.sample(-240,t*1000),r=right.sample(240,t*1000);
   const expected=CHASE_TURN_REVEAL*(1-(1+CHASE_TURN_RESPONSE*t)*Math.exp(-CHASE_TURN_RESPONSE*t));
   assert.ok(Math.abs(r-expected)<1e-11);assert.ok(Math.abs(l+r)<1e-11);
   assert.ok(r>=previous-1e-12&&r<=CHASE_TURN_REVEAL);previous=r;
  }
 }
});

await test('turn-in, held steering, zero return and reversal have no uneven swinging at 60/120/240 Hz',()=>{
 const knots=[[0,0],[.5,0],[.8,-240],[2.5,-240],[2.8,0],[4.5,0],[4.8,240],[6.5,240],[6.8,-240],[8.5,-240],[8.8,0],[10.5,0]];
 const input=(t:number)=>{const index=knots.findIndex(k=>k[0]>=t);if(index<=0)return knots[Math.max(index,0)][1];const a=knots[index-1],b=knots[index];return a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]);};
 const traces:number[][]=[];
 for(const rate of [60,120,240]){
  const turn=createChaseTurnOffset(),values:number[]=[];let previous=0,velocity=0,acceleration=0,reversalChanges=0,reversalDirection=1;
  for(let i=0;i<=rate*10.5;i++){
   const t=i/rate,value=turn.sample(input(t),t*1000),v=(value-previous)*rate,a=(v-velocity)*rate,j=(a-acceleration)*rate;
   assert.ok(Math.abs(value)<=CHASE_TURN_REVEAL+1e-12,'no overshoot beyond either bounded target');
   assert.ok(Math.abs(v)<1.7&&Math.abs(a)<10&&Math.abs(j)<100,'bounded angular speed, acceleration and jerk');
   if(t>.5&&t<2.5)assert.ok(value<=previous+1e-12,'monotonic turn-in');
   if(t>2.8&&t<4.5)assert.ok(value>=previous-1e-12&&value<0,'monotonic zero return without crossing it');
   if(t>=2.1&&t<=2.5)assert.ok(Math.abs(value+CHASE_TURN_REVEAL)<.0003,'held offset is stable');
   if(t>6.5&&t<8.5&&Math.abs(v)>1e-9){const sign=Math.sign(v);if(sign!==reversalDirection){reversalChanges++;reversalDirection=sign;}}
   if(i%(rate/60)===0)values.push(value);
   previous=value;velocity=v;acceleration=a;
  }
  assert.equal(reversalChanges,1,'reversal changes movement direction exactly once, without ringing');
  assert.ok(Math.abs(previous)<.0001,'smoothly returns to zero');traces.push(values);
 }
 for(const values of traces)values.forEach((value,i)=>assert.ok(Math.abs(value-traces[0][i])<1e-10,'exact response agrees at shared display times'));
});
