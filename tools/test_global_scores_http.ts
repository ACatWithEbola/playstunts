import {test} from 'node:test';
import assert from 'node:assert/strict';
import {finishedScoreFixture} from './global-score-fixture.ts';
import {GLOBAL_SCORE_RULES,scoreHash,scoreTicks} from '../lib/game/global-score-format.ts';
const origin=process.argv[2]??'http://localhost:3002';
test('actual Worker/D1 shares independent player scores and rejects invalid races',async()=>{
 const proof=await finishedScoreFixture(),track=await scoreHash(Uint8Array.from(proof.replay.slice(24,0x722)));
 const submit=(value:unknown)=>fetch(origin+'/api/highscores',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES},body:JSON.stringify(value)});
 const named=(name:string)=>{const record=[...proof.record];record.fill(0,0,17);Array.from(name,c=>c.charCodeAt(0)).forEach((n,i)=>record[i]=n);return {...proof,record};};
 const responses=await Promise.all([submit(named('QA ONE')),submit(named('QA TWO'))]);
 for(const response of responses){const body=await response.json() as {accepted:boolean};assert.equal(response.status,200,JSON.stringify(body));assert.equal(body.accepted,true);}
 const read=()=>fetch(origin+'/api/highscores?track='+track).then(r=>r.json() as Promise<{file:number[]}>);
 let board=await read();assert.equal(board.file.length,364);const names=Array.from({length:7},(_,i)=>String.fromCharCode(...board.file.slice(i*52,i*52+16)).split('\0')[0]);
 assert.ok(names.includes('QA ONE'));assert.ok(names.includes('QA TWO'));
 const before=board.file;
 const duplicate=await submit(named('QA ONE'));assert.equal(duplicate.status,200);
 const bad=await submit({...proof,continued:true});assert.equal(bad.status,400);
 const fake=named('QA FAKE');fake.record[50]=1;fake.record[51]=0;assert.equal((await submit(fake)).status,422);
 const cutoff=named('QA CRASH');cutoff.replay=cutoff.replay.slice(0,0x722+100);assert.equal((await submit(cutoff)).status,422);
 board=await read();assert.deepEqual(board.file,before);
 assert.equal(scoreTicks(board.file.slice(0,52)),scoreTicks(proof.record));
 const altered=Uint8Array.from(proof.replay.slice(24,0x722));altered[901]^=1;
 const other=await fetch(origin+'/api/highscores?track='+await scoreHash(altered)).then(r=>r.json() as Promise<{file:number[]}>);assert.equal(scoreTicks(other.file.slice(0,52)),65535,'Terrain edits must have separate boards');
 assert.equal((await fetch(origin+'/api/highscores?track=invalid')).status,400);
});
