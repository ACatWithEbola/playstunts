import assert from 'node:assert/strict';
import {createRetainedMenuClockOwner} from '../lib/game/retained-menu-clock-owner.ts';
import {advanceRetainedMenuClock} from '../lib/game/retained-menu-clock.ts';
let wall=100;const initial={callbackCounter:0xfffffff0,gameCounter:0xfffffffe,divisor:5,countdown:3};
const snapshot={...initial},owner=createRetainedMenuClockOwner(initial,()=>wall);
assert.throws(()=>owner.audioTick(),/ownership/);
wall=110;assert.deepEqual(owner.snapshot(),advanceRetainedMenuClock(initial,10));
owner.takeAudioOwnership();let expected=advanceRetainedMenuClock(initial,10);
wall=1000;
for(let i=0;i<37;i++){owner.audioTick();expected=advanceRetainedMenuClock(expected,1);}
assert.deepEqual(owner.snapshot(),expected,'Elapsed wall time must not also count during audio ownership');
owner.takeWallOwnership();wall=1007;expected=advanceRetainedMenuClock(expected,7);
assert.deepEqual(owner.snapshot(),expected,'Only new wall ticks count after handover');
assert.equal(owner.inputClock.counter(),54,'Cumulative input time must not wrap with retained callback memory');
assert.equal(owner.inputClock.gameCounter(),expected.gameCounter);
assert.throws(()=>owner.audioTick(),/ownership/);
const returned=owner.snapshot();returned.callbackCounter=0;assert.deepEqual(owner.snapshot(),expected);
assert.deepEqual(initial,snapshot);
wall=1;assert.throws(()=>owner.snapshot(),/Invalid/);
assert.throws(()=>createRetainedMenuClockOwner(initial,()=>NaN),/Invalid/);
for(const divisor of [0,1,5,0x7fff,0x8000,0xffff])for(const countdown of [0,1,5,0x7fff,0x8000,0xffff]){
 let now=0;const before={callbackCounter:0xfffffffd,gameCounter:0xfffffffd,divisor,countdown},clock=createRetainedMenuClockOwner(before,()=>now);
 now=17;clock.takeAudioOwnership();for(let i=0;i<23;i++)clock.audioTick();now=200;clock.takeWallOwnership();now=231;
 assert.deepEqual(clock.snapshot(),advanceRetainedMenuClock(before,71),'Handover retains signed divider behavior and wraps');
 assert.equal(clock.inputClock.counter(),71);
 assert.equal(clock.inputClock.gameCounter(),clock.snapshot().gameCounter);
}
console.log('Exclusive menu clock handover avoids double counting, retains divider/wrap phase, rejects stale audio ticks and preserves input state');
{
 let wall=0;const clock=createRetainedMenuClockOwner({callbackCounter:10,gameCounter:2,divisor:5,countdown:4},()=>wall);
 wall=13;const elapsed=clock.inputClock.counter();
 const race={callbackCounter:900,gameCounter:181,divisor:5,countdown:2};
 clock.adoptRetainedClock(race);assert.deepEqual(clock.snapshot(),race);assert.equal(clock.inputClock.counter(),elapsed,'Adopting original memory phase must not rewind cumulative input time');
 race.callbackCounter=0;assert.equal(clock.snapshot().callbackCounter,900);
 clock.takeAudioOwnership();assert.throws(()=>clock.adoptRetainedClock(race),/stopped audio/);
 clock.audioTick();clock.takeWallOwnership();wall=16;assert.deepEqual(clock.snapshot(),advanceRetainedMenuClock({callbackCounter:900,gameCounter:181,divisor:5,countdown:2},4));
}
console.log('Stopped menu owner adopts restored race counter/divider phase without rewinding input time or sharing caller memory');
