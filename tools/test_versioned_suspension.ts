import assert from 'node:assert/strict';
import {stepSuspension} from '../lib/physics/suspension.ts';
import {horizontalContact} from '../lib/physics/contact.ts';
import type {Vector} from '../lib/physics/math.ts';
// Paired original MS90/MS91 executable outputs, deterministic oracle case9.
const before={rc2:244,rc4:-273,rc5:-344};
const legacy={rc2:-158,rc4:-273,rc5:-340,height:109};
const modern={rc2:-159,rc4:-273,rc5:-340,height:110};
assert.deepEqual(stepSuspension(before,-537),legacy);
assert.deepEqual(stepSuspension(before,-537,'ms-1990'),legacy);
assert.deepEqual(stepSuspension(before,-537,'ms-1991'),modern);
assert.deepEqual(before,{rc2:244,rc4:-273,rc5:-344});
const points=Array.from({length:4},()=>[0,-537*64,0] as Vector),state={rc1:[0,0,0,0],rc2:Array(4).fill(244),rc4:Array(4).fill(-273),rc5:Array(4).fill(-344)},planes=Array.from({length:4},()=>({height:0,surface:1}));
const normal=horizontalContact(points,state,[0,0,0],planes);
assert.deepEqual(normal,horizontalContact(points,state,[0,0,0],planes,20,undefined,'ms-1990'));
assert.deepEqual(normal.suspension.rc2,Array(4).fill(legacy.rc2));
assert.deepEqual(horizontalContact(points,state,[0,0,0],planes,20,undefined,'ms-1991').suspension.rc2,Array(4).fill(modern.rc2));
console.log('Paired original suspension rounding regression preserves legacy and MS91 branches');
