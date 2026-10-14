import assert from 'node:assert/strict';
import {ms91ForwardSkyRegion,ms91FullSkyRegion} from '../lib/game/ms91-sky-region.ts';
assert.deepEqual(ms91ForwardSkyRegion(100,40,0),[0,320,60,100]);assert.deepEqual(ms91ForwardSkyRegion(100,40,4),[0,320,99,100]);
assert.deepEqual(ms91ForwardSkyRegion(-32768,1,4),[0,320,32767,-32768]);assert.deepEqual(ms91ForwardSkyRegion(32767,65535,0),[0,320,-32768,32767]);
assert.deepEqual(ms91FullSkyRegion([10,100,5,80]),[0,320,5,80]);
console.log('MS91 forward/fallback sky bounds retain original full-width, detail4 strip and signed-word wrapping');
