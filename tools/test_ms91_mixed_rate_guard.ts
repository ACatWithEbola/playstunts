import assert from 'node:assert/strict';
import {readRecordedTwoCarRace,stepRecordedTwoCarRace} from '../lib/game/recorded-two-car-race.ts';
const d=0x20000,memory=new Uint8Array(0x80000);
memory[d+0x8fc8]=1;
const state=readRecordedTwoCarRace(memory,d),original=memory.slice();
// Deliberately incomplete resources: the rate guard must reject before using
// tuning, geometry or caller-memory fields. This is not a two-car race fixture.
const player={caller:{stackSegment:0,entryStackPointer:0,incomingSI:0},track:{framesPerSecond:10}} as Parameters<typeof stepRecordedTwoCarRace>[1];
const opponent={track:{framesPerSecond:20}} as Parameters<typeof stepRecordedTwoCarRace>[2];
assert.throws(()=>stepRecordedTwoCarRace(state,player,opponent),/same recording cadence/);
assert.deepEqual(memory,original);
console.log('Mixed player/opponent recording rates reject before simulation or memory writes');
