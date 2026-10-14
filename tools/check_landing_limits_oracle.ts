import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wheelPlaneContact} from '../lib/physics/wheel-plane-contact.ts';
import {rotateZXY} from '../lib/physics/rotation.ts';
const plane={id:0,roll:0,pitch:0,origin:[0,0,0] as [number,number,number],normal:[0,8192,0] as [number,number,number],rotation:rotateZXY(0,0,0)};
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));assert.equal(rows.length,384);
for(const row of rows){
 const actual=wheelPlaneContact({physicsEngine:row.generation,origin:[0,0,0],proposed:[0,0,0],plane,groundPlane:plane,tileOrigin:[0,0,0],carRotation:[0,0,0],wheelAngle:0,scaledRoadSpeed:0,fallSpeed:row.fall,fallIncrement:0,surface:1,underside:false,invertedPull:0,invertedOffset:[0,0,0],soundFlags:row.flags});
 assert.equal(actual.soundFlags,row.sound);assert.deepEqual(actual.crashEvents,row.events);assert.equal(actual.fallSpeed,row.after);
}
console.log('384 original landing sequences match native signed sound/crash boundaries and fall-speed reset in both versions');
