import assert from 'node:assert/strict';
import {fixtureData} from './global-score-fixture.ts';
import {versionedRouteTables} from '../lib/game/versioned-route-tables.ts';
const before=structuredClone({records:fixtureData.records,points:fixtureData.points});
assert.equal(versionedRouteTables(fixtureData),fixtureData);
const legacy={...fixtureData,physicsEngine:'ms-1990' as const};
assert.equal(versionedRouteTables(legacy),legacy);
const modern=versionedRouteTables({...fixtureData,physicsEngine:'ms-1991' as const});
assert.equal(versionedRouteTables(modern),modern,'Adapter is idempotent');
const restored=versionedRouteTables({...modern,physicsEngine:'ms-1990' as const});
assert.deepEqual(restored.records,fixtureData.records);assert.deepEqual(restored.points,fixtureData.points);
assert.equal(versionedRouteTables(restored),restored,'Restored legacy selection is idempotent');
for(let tile=0;tile<198;tile++){
 if(tile>=40&&tile<=47){
  assert.equal(modern.records[tile].records[0][5],2);
  assert.deepEqual(modern.points[tile].records[0].primary,[[-120,-1,-334],[120,-1,-334],[-120,-1,334],[120,-1,334]]);
  assert.notEqual(modern.records[tile],fixtureData.records[tile]);
 }else{
  assert.equal(modern.records[tile],fixtureData.records[tile]);
  assert.equal(modern.points[tile],fixtureData.points[tile]);
 }
}
assert.deepEqual({records:fixtureData.records,points:fixtureData.points},before);
console.log('MS91 route adapter changes only eight audited definitions; legacy tables unchanged and repeated selection idempotent');
