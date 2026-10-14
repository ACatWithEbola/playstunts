import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wheelPlaneContact} from '../lib/physics/wheel-plane-contact.ts';
import {rotateZXY} from '../lib/physics/rotation.ts';
const plane={id:0,roll:0,pitch:0,origin:[0,0,0] as [number,number,number],normal:[0,8192,0] as [number,number,number],rotation:rotateZXY(0,0,0)};
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,216);
for(const row of rows){
 const actual=wheelPlaneContact({physicsEngine:'ms-1991',framesPerSecond:row.rate,origin:[0,1000000,0],proposed:[0,1000000,0],plane,groundPlane:plane,tileOrigin:[0,0,0],carRotation:[0,0,0],wheelAngle:0,scaledRoadSpeed:0,fallSpeed:row.speed,fallIncrement:row.increment,surface:1,underside:true,invertedPull:0,invertedOffset:[0,0,0],soundFlags:0});
 assert.equal(actual.fallSpeed,row.fall);assert.equal(actual.position[1],row.height);
}
console.log('216 original10/20Hz signed fall updates match native wheel contact,including wrap and both slow-mode displacements');
