import assert from 'node:assert/strict';
import {createNativeOriginalRenderer} from '../lib/game/native-original-renderer.ts';

// Construction alone must retain the race identity without touching simulation
// memory. Pixel and enhanced-renderer parity require separate integration tests.
const baseline=new Uint8Array(0x100000);
baseline.fill(0x37,0xa0000,0xa0000+64000);
const before=baseline.slice();
for(const physicsEngine of ['ms-1990','ms-1991','bb-1991'] as const){
 const renderer=createNativeOriginalRenderer(baseline,[],{} as never,{allocatedResources:true,physicsEngine});
 assert.equal(renderer.physicsEngine,physicsEngine);
 assert.deepEqual(baseline,before);
}
assert.equal(createNativeOriginalRenderer(baseline,[],{} as never,{allocatedResources:true}).physicsEngine,'ms-1990');
assert.throws(()=>createNativeOriginalRenderer(baseline,[],{} as never,{allocatedResources:true,physicsEngine:'unknown' as never}),/Unsupported physics engine/);
assert.throws(()=>createNativeOriginalRenderer(baseline,[],{} as never,{allocatedResources:true,experimentalMs91RegionFlags:true}),/requires an MS91 race/);
assert.deepEqual(baseline,before);
console.log('Default renderer retains explicit engine identity, defaults missing identity to legacy, rejects unknown engines, and preserves source memory');
