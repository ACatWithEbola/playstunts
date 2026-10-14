import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finishedScoreFixture,fixtureData} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {scoreTicks} from '../lib/game/global-score-format.ts';
import {readFileSync} from 'node:fs';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
const referencePath=process.argv[2];
for(const engine of ['ms-1990','ms-1991'] as const)test('a genuine '+engine+' race lasting over ten minutes verifies through replay-buffer rollover',async()=>{
 let reference:Uint8Array|undefined,source:Uint8Array|undefined;
 if(engine==='ms-1991'){
  // Copy-only fixture from the original-verified 796-frame Countach recording.
  source=referencePath?new Uint8Array(readFileSync(referencePath)):new Uint8Array(Buffer.from(readFileSync(new URL('./fixtures/ms91-qa91r001.hex',import.meta.url),'utf8').trim(),'hex'));
  const decoded=decodeVersionedReplay(source,'ms-1991');assert.equal(decoded.framesPerSecond,20);reference=decoded.bytes;
 }
 const proof=await finishedScoreFixture(12100,engine,reference);assert.ok(scoreTicks(proof.record)>12000);
 const verified=await verifyGlobalScore(proof,fixtureData);assert.equal(verified.ticks,scoreTicks(proof.record));
 if(source&&referencePath)assert.deepEqual(new Uint8Array(readFileSync(referencePath)),source);
});
