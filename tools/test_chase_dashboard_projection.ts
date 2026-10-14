import assert from 'node:assert/strict';
import {enhancedViewProjection} from '../lib/game/enhanced-view-projection.ts';
const on=[160,65,230,155],off=[160,100,230,155];
for(const fov of [40,58,70]){
 const first=enhancedViewProjection(on,fov),second=enhancedViewProjection(off,fov);
 assert.deepEqual(first,second,'Dashboard cannot change chase optical axis or focal length');
 assert.deepEqual(first.slice(0,2),[160,100]);
}
assert.deepEqual(enhancedViewProjection(on),on);assert.deepEqual(enhancedViewProjection(off),off);
assert.deepEqual(on,[160,65,230,155]);assert.deepEqual(off,[160,100,230,155]);
console.log('Chase projection ignores native dashboard origin across three fields of view; original cockpit projections and source arrays retained');
