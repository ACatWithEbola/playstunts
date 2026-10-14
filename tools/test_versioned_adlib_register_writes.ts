import assert from 'node:assert/strict';
import {versionedAdlibRegisterWrites} from '../lib/game/versioned-adlib-register-writes.ts';
const driver=new Uint8Array(3571);
assert.deepEqual(versionedAdlibRegisterWrites(driver,[[10,1],[10,1],[10,2],[10,2]],'ms-1991'),[[10,1],[10,2]]);
assert.deepEqual(versionedAdlibRegisterWrites(driver,[[10,2]],'ms-1991'),[]);
const before=driver.slice();assert.throws(()=>versionedAdlibRegisterWrites(driver,[[10,3],[256,1]],'ms-1991'));assert.deepEqual(driver,before);
assert.deepEqual(versionedAdlibRegisterWrites(driver,[[10,2],[10,2]],'ms-1990'),[[10,2],[10,2]]);assert.deepEqual(driver,before);
console.log('Modern OPL batch/cache persists across calls, rejects invalid batches before mutation and leaves legacy unchanged');
