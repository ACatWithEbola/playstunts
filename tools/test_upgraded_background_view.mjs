import assert from 'node:assert/strict';
import {upgradedBackgroundHeight} from '../lib/game/upgraded-background-view.ts';

assert.equal(upgradedBackgroundHeight(true,0,720,640),0);
assert.equal(upgradedBackgroundHeight(false,3,720,640),720);
assert.equal(upgradedBackgroundHeight(false,0,720,640),640);
assert.equal(upgradedBackgroundHeight(false,0,720),720);

console.log('Upgraded background framing regression checks passed.');
