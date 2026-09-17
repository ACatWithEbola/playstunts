import assert from 'node:assert/strict';
import {upgradedBackgroundHeight,upgradedBackgroundView} from '../lib/game/upgraded-background-view.ts';

assert.equal(upgradedBackgroundHeight(true,0,720),0);
assert.equal(upgradedBackgroundHeight(false,3,720),720);
assert.equal(upgradedBackgroundHeight(false,0,720),720);
assert.equal(upgradedBackgroundHeight(false,0,720),720);

const banked=upgradedBackgroundView([32,11,987]);
assert.deepEqual(banked.angles,[0,11,987]);
assert.equal(banked.rotation,-32*Math.PI/512);
assert.deepEqual(upgradedBackgroundView([0,11,987]),{angles:[0,11,987],rotation:0});

console.log('Upgraded background framing regression checks passed.');
