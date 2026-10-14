import assert from 'node:assert/strict';
import {activeRaceData} from '../lib/game/active-race-data.ts';
const catalog={},records=[1,2,3],page={physicsEngine:'ms-1990',framesPerSecond:20,catalog,records},before=structuredClone(page);
for(const physicsEngine of ['ms-1990','ms-1991','bb-1991'] as const)for(const framesPerSecond of [10,20] as const){
 const session={physicsEngine,framesPerSecond},result=activeRaceData(page,session);
 assert.equal(result.physicsEngine,physicsEngine);assert.equal(result.framesPerSecond,framesPerSecond);
 assert.equal(result.catalog,catalog);assert.equal(result.records,records);assert.notEqual(result,page);
 assert.deepEqual(session,{physicsEngine,framesPerSecond});assert.deepEqual(page,before);
}
assert.throws(()=>activeRaceData(page,{physicsEngine:'unknown',framesPerSecond:20} as never));
assert.throws(()=>activeRaceData(page,{physicsEngine:'ms-1991',framesPerSecond:15} as never));
console.log('Active engine/cadence override stale page defaults without modifying data or session; unknown identities fail closed');
