import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureData,finishedScoreFixture} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES,scoreHash} from '../lib/game/global-score-format.ts';
const origin=process.argv[2]??'http://localhost:3002';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Assessment HTTP fixtures are local-only');
test('server assessment ignores claimed categories and preserves existing category boards',async()=>{
 const proof=await finishedScoreFixture(),verified=await verifyGlobalScore(proof,fixtureData),hash=await scoreHash(Uint8Array.from(proof.replay.slice(24,0x722)));
 const directory=()=>fetch(origin+'/api/leaderboards').then(r=>r.json() as Promise<{summary:{scores:number}}>),before=await directory();
 const categories=['full_route','shortcuts_detected','not_assessed'];
 const readCategory=async(category:string)=>{const response=await fetch(origin+'/api/highscores?track='+hash+'&car=PMIN&category='+category);assert.equal(response.status,200);const body=await response.json() as {file:number[]};assert.equal(body.file.length,364);return body.file;};
 const prior=await Promise.all(categories.map(readCategory));
 const check=await fetch(origin+'/api/highscores',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES},body:JSON.stringify({...proof,validateOnly:true,routeAssessment:'full_route'})});
 assert.equal(check.status,200);assert.equal((await check.json() as {routeAssessment:string}).routeAssessment,verified.routeAssessment);assert.equal((await directory()).summary.scores,before.summary.scores);
 for(const [index,category] of categories.entries()){
  assert.deepEqual(await readCategory(category),prior[index],'Validation-only request must not alter any retained category board');
 }
 assert.equal((await fetch(origin+'/api/highscores?track='+hash+'&category=claimed-legit')).status,400);
});
