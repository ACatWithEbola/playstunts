import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTrackLabelCatalog} from '../lib/server/track-label-catalog.ts';
import {scoreHash} from '../lib/game/global-score-format.ts';
test('optional catalog failures use fallback labels, retry and cache recovery',async()=>{
 let calls=0,warnings=0;const raw=Array(1802).fill(0),catalog=createTrackLabelCatalog(async()=>{calls++;if(calls===1)throw Error('Temporary asset outage');return {tracks:[{name:'DEFAULT',raw}]};},()=>warnings++);
 assert.equal((await catalog()).size,0);assert.equal(warnings,1);
 const restored=await catalog();assert.equal(restored.get(await scoreHash(Uint8Array.from(raw))),'DEFAULT');assert.equal(calls,2);assert.equal(await catalog(),restored);assert.equal(calls,2);
});
