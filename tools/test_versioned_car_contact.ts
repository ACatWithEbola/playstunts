import assert from 'node:assert/strict';
import {carContactResponse} from '../lib/physics/car-contact-response.ts';
import {raceCarContact} from '../lib/physics/race-car-contact.ts';
const first={yaw:0,roadSpeed:0},other={yaw:0,roadSpeed:1000};
const legacy=carContactResponse(first,other,'ms-1990');
assert.deepEqual(carContactResponse(first,other),legacy,'Missing identity remains legacy');
assert.equal(legacy.cars[0].roadSpeed,63616);
assert.equal(carContactResponse(first,other,'ms-1991').cars[0].roadSpeed,0);
const body={position:[0,0,0] as [number,number,number],angles:[0,0,0] as [number,number,number],dimensions:[100,100,100] as [number,number,number],radius:100};
const cars=[{...first,speed:0,wheelAngle:0,contact:0},{...other,speed:1000,wheelAngle:0,contact:0}] as const;
for(const engine of ['ms-1990','ms-1991'] as const){
 const actual=raceCarContact(true,0,[body,body],cars,engine);
 assert.equal(actual.suppressPose,true);
 assert.equal(actual.cars[0].roadSpeed,engine==='ms-1990'?63616:0,'Collision wrapper must forward version');
}
console.log('Versioned car collision clamps modern low speed, preserves exact default/legacy wrap, wrapper forwards engine');
