import assert from 'node:assert/strict';
import {wheelPlaneContact,type WheelPlaneInput} from '../lib/physics/wheel-plane-contact.ts';
import {rotateZXY} from '../lib/physics/rotation.ts';
import {i16} from '../lib/physics/math.ts';
import {trackContact,type TrackGeometry} from '../lib/physics/track-contact.ts';
import {proposeWheels} from '../lib/physics/chassis.ts';
const plane={id:0,roll:0,pitch:0,origin:[0,0,0] as [number,number,number],normal:[0,8192,0] as [number,number,number],rotation:rotateZXY(0,0,0)};
const input:WheelPlaneInput={physicsEngine:'ms-1991',origin:[0,1000000,0],proposed:[0,1000000,0],plane,groundPlane:plane,tileOrigin:[0,0,0],carRotation:[0,0,0],wheelAngle:0,scaledRoadSpeed:0,fallSpeed:0,fallIncrement:21,surface:1,underside:true,invertedPull:0,invertedOffset:[0,0,0],soundFlags:0};
for(const increment of [15,21])for(const speed of [-32768,-1,0,100,32760]){
  const s={...input,fallSpeed:speed,fallIncrement:increment};
  const omitted=wheelPlaneContact(s),normal=wheelPlaneContact({...s,framesPerSecond:20});
  assert.deepEqual(omitted,normal,'Default cadence must preserve the old 20 Hz path');
  let fall=speed,height=s.proposed[1];
  for(let step=0;step<2;step++){fall=i16(fall+increment);height=(height-fall)|0;}
  const slow=wheelPlaneContact({...s,framesPerSecond:10});
  assert.equal(slow.fallSpeed,fall);
  assert.equal(slow.position[1],height);
  assert.equal(slow.surface,0);
  assert.deepEqual(slow.crashEvents,[]);
}
// The inverted attraction path does not acquire a second gravity substep.
const inverted={...input,proposed:[0,64*20,0] as [number,number,number],invertedPull:192,invertedOffset:[0,-192,0] as [number,number,number]};
assert.deepEqual(wheelPlaneContact({...inverted,framesPerSecond:10}),wheelPlaneContact({...inverted,framesPerSecond:20}));
console.log('MS91 falling contact: two 10 Hz substeps, signed wrap and unchanged 20 Hz/inverted paths pass');

const track:TrackGeometry={physicsEngine:'ms-1991',raw:Array(1802).fill(0),objects:[{id:0,rotation:0,surface:1,multiTile:0,physics:0}],planes:[plane],walls:[]};
const chassis={position:[100000,100000,100000] as [number,number,number],rotation:[0,0,0] as [number,number,number],roadSpeed:1000,frontWheelAngle:0,wheelAngle:0,spin:0,allContact:0,suspension:[0,0,0,0]};
const wheels=Array.from({length:4},()=>[0,0,0] as [number,number,number]);
const history=proposeWheels({...chassis,roadSpeed:0},wheels).map(point=>point.map(value=>value>>6) as [number,number,number]);
const suspension={rc1:[0,0,0,0],rc2:[0,0,0,0],rc4:[0,0,0,0],rc5:[0,0,0,0]};
const normal=trackContact(chassis,wheels,history,suspension,track,0,0);
assert.deepEqual(normal,trackContact(chassis,wheels,history,suspension,{...track,framesPerSecond:20},0,0));
const slow=trackContact(chassis,wheels,history,suspension,{...track,framesPerSecond:10},0,0);
assert.deepEqual(normal.suspension.rc1,[21,21,15,15]);
assert.deepEqual(slow.suspension.rc1,[42,42,30,30]);
assert.notDeepEqual(slow.centres,normal.centres);
console.log('Track contact propagates 10 Hz falling cadence and preserves default 20 Hz results');
