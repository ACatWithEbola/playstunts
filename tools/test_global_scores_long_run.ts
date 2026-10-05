import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finishedScoreFixture,fixtureData} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {scoreTicks} from '../lib/game/global-score-format.ts';
test('a genuine race lasting over ten minutes verifies through original replay-buffer rollover',async()=>{
 const proof=await finishedScoreFixture(12100);assert.ok(scoreTicks(proof.record)>12000);
 const verified=await verifyGlobalScore(proof,fixtureData);assert.equal(verified.ticks,scoreTicks(proof.record));
});
