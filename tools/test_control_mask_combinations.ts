import assert from 'node:assert/strict';
import {originalDrivingKeyControls} from '../lib/game/driving-key-controls.ts';
const masks=[16,32,9,1,5,4,6,2,10,8],bindings=Array.from({length:10},(_,i)=>i);
for(let combination=0;combination<1024;combination++){
 let expected=0,fallbackCalls=0;
 for(let i=0;i<10;i++)if(combination>>i&1)expected|=masks[i];
 assert.equal(originalDrivingKeyControls(bindings,i=>Boolean(combination>>i&1),()=>{fallbackCalls++;return 0;}),expected);
 assert.equal(fallbackCalls,combination===0?1:0);
}
assert.equal(originalDrivingKeyControls(bindings,()=>false,()=>0x12345),0x2345);
const browserBindings=[57,28,71,72,73,77,81,80,79,75];
assert.equal(originalDrivingKeyControls(browserBindings,scan=>scan===77,()=>0),4,'Right scan77 is input bit4');
assert.equal(originalDrivingKeyControls(browserBindings,scan=>scan===75,()=>0),8,'Left scan75 is input bit8');
assert.equal(originalDrivingKeyControls(browserBindings,scan=>scan===72||scan===77,()=>0),5,'Up plus Right');
assert.equal(originalDrivingKeyControls(browserBindings,scan=>scan===72||scan===75,()=>0),9,'Up plus Left');
console.log('PASS: all 1024 native key combinations match original outcomes; joystick fallback bounded and suppressed when keys held');
