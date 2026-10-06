import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureData,finishedScoreFixture} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES,scoreHash,scoreTicks} from '../lib/game/global-score-format.ts';
const origin=process.argv[2]??'http://localhost:3002';
test('server assessment is score-read-only, ignores claimed categories and serves isolated category boards',async()=>{
 const proof=await finishedScoreFixture(),verified=await verifyGlobalScore(proof,fixtureData),hash=await scoreHash(Uint8Array.from(proof.replay.slice(24,0x722)));
 const directory=()=>fetch(origin+'/api/leaderboards').then(r=>r.json() as Promise<{summary:{scores:number}}>),before=await directory();
 const check=await fetch(origin+'/api/highscores',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES},body:JSON.stringify({...proof,validateOnly:true,routeAssessment:'full_route'})});
 assert.equal(check.status,200);assert.equal((await check.json() as {routeAssessment:string}).routeAssessment,verified.routeAssessment);assert.equal((await directory()).summary.scores,before.summary.scores);
 for(const category of ['full_route','shortcuts_detected','not_assessed']){
  const response=await fetch(origin+'/api/highscores?track='+hash+'&car=PMIN&category='+category),body=await response.json() as {file:number[]};assert.equal(response.status,200);assert.equal(body.file.length,364);
  if(category!=='not_assessed')assert.equal(scoreTicks(body.file.slice(0,52)),65535,'Unknown fixture cannot leak into a confirmed category');
 }
 assert.equal((await fetch(origin+'/api/highscores?track='+hash+'&category=claimed-legit')).status,400);
});
