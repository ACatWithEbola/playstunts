import assert from 'node:assert/strict';
import {wheelPlaneContact,type WheelPlaneInput} from '../lib/physics/wheel-plane-contact.ts';
import {rotateZXY} from '../lib/physics/rotation.ts';
const roof={id:5,roll:0,pitch:0,origin:[0,100,0] as [number,number,number],normal:[0,8192,0] as [number,number,number],rotation:rotateZXY(0,0,0)};
const ground={...roof,id:0,origin:[0,0,0] as [number,number,number]};
let cases=0;
for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const old of [-100,-25,-24,-23,-13,-12,-11])for(const next of [-25,-24,-23,-13,-12,-11]){
 const input:WheelPlaneInput={physicsEngine,origin:[0,(100+old)*64,0],proposed:[0,(100+next)*64,0],plane:roof,groundPlane:ground,tileOrigin:[0,0,0],carRotation:[0,0,0],wheelAngle:0,scaledRoadSpeed:0,fallSpeed:0,fallIncrement:0,surface:1,underside:false,invertedPull:0,invertedOffset:[0,0,0],soundFlags:0};
 const result=wheelPlaneContact(input);
 if(old<-12&&next<-12&&next<=-24){
  assert.equal(result.planeId,0);assert.equal(result.underside,true);
  assert.deepEqual(result.crashEvents,[]);assert.deepEqual(result.position,input.proposed);
 }else{
  assert.equal(result.planeId,5);assert.equal(result.underside,false);
  const crashed=old<-12&&next<-12;
  assert.deepEqual(result.crashEvents,crashed?[5]:[]);
  assert.deepEqual(result.position,[0,crashed?(100+2*old-6)*64:100*64,0]);
  assert.equal(result.fallSpeed,0);
 }
 cases++;
}
console.log(`${cases} native wheel-contact underside cases preserve ground fallback,crash-event5 and signed penetration correction across both engines; original full-response execution remains a separate requirement`);
