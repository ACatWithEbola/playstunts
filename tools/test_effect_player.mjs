import assert from 'node:assert/strict';
import {stepEffectSequence} from '../lib/game/effect-player.ts';

const stale=stepEffectSequence({offset:0,wait:0},Uint8Array.from([0,0xe0,7]));
assert.equal(stale.offset,null);
assert.equal(stale.wait,0xffffffff);
assert.deepEqual(stale.events,[{kind:'end'}]);

const noteThenEnd=stepEffectSequence({offset:0,wait:0},Uint8Array.from([0,60,4,1,0xd9]));
assert.equal(noteThenEnd.offset,3);
assert.equal(noteThenEnd.wait,0);
assert.deepEqual(noteThenEnd.events,[{kind:'note',note:60,duration:4}]);

console.log('Effect player regression checks passed.');
