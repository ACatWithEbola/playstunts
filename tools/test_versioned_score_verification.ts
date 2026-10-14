import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finishedScoreFixture,fixtureData} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {scoreHash} from '../lib/game/global-score-format.ts';
test('legacy verification ignores caller engine defaults and retains existing IDs and bytes',async()=>{
 const input=await finishedScoreFixture(),snapshot=structuredClone(input);
 const old=await verifyGlobalScore(input,{...fixtureData,physicsEngine:'bb-1991',framesPerSecond:10});
 assert.equal(old.physicsEngine,'ms-1990');
 assert.equal(old.id,await scoreHash(Uint8Array.from([...old.replay,...old.record])));
 const tagged=await verifyGlobalScore({...input,physicsEngine:'ms-1990'},fixtureData);
 assert.equal(tagged.id,old.id);assert.deepEqual(tagged.replay,old.replay);
 assert.deepEqual(input,snapshot);
 await assert.rejects(()=>verifyGlobalScore({...input,physicsEngine:'unknown'},fixtureData));
 await assert.rejects(()=>verifyGlobalScore({...input,framesPerSecond:10},fixtureData),/Only 20 Hz/);
 await assert.rejects(()=>verifyGlobalScore({...input,framesPerSecond:30},fixtureData),/Unsupported replay cadence/);
});
test('a legacy finish cannot gain 1991 acceptance by relabeling its engine',async()=>{
 const input=await finishedScoreFixture(),snapshot=structuredClone(input);
 await assert.rejects(()=>verifyGlobalScore({...input,physicsEngine:'bb-1991'},fixtureData),/verify.*finish/);
 await assert.rejects(()=>verifyGlobalScore({...input,physicsEngine:'ms-1991'},fixtureData),/verify.*finish/);
 assert.deepEqual(input,snapshot);
});
