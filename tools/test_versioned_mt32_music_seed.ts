import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
for(const name of ['titl','slct','vict','over']){
 const path=`public/game/mt32-music-${name}-seed.json`,source=readFileSync(path,'utf8'),seed=JSON.parse(source);
 for(const generation of ['ms-1990','ms-1991','ms-1990','ms-1991'] as const){
  const converted=versionedMt32MusicSeed(seed,generation);
  assert.equal(converted.driverGeneration,generation);
  assert.deepEqual(converted.driver,generation==='ms-1991'?Array.from(versionedMt15Resource(generation)!):seed.driver);
  const {driver,driverGeneration,...score}=converted;
  const {driver:originalDriver,...originalScore}=seed;
  assert.deepEqual(score,originalScore,'Score, timers, voice allocation and original quirks remain unchanged');
  converted.bank[0]^=1;converted.hardware[0][0]^=1;converted.initialWrites[0][1]^=1;converted.driver[0]^=1;
  assert.equal(JSON.stringify(seed),source,'Converted mutable state cannot alter retained original seed');
 }
 const active=structuredClone(seed);active.hardware[0][1]=1;
 assert.throws(()=>versionedMt32MusicSeed(active,'ms-1991'),/inactive/);
 assert.throws(()=>versionedMt32MusicSeed(versionedMt32MusicSeed(seed,'ms-1991'),'ms-1990'),/original legacy/);
 assert.equal(readFileSync(path,'utf8'),source);
}
console.log('Sixteen alternating Roland startup selections retain exact score state with independent driver/memory ownership; active/already-modern seeds rejected');
