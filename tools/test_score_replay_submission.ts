import {boundedRequestText} from '../lib/server/bounded-request-body.ts';
import {assertRaceEngineIdentity,raceEngineStatements} from '../lib/server/race-engine-metadata.ts';
import {engineScopedRetention} from '../lib/server/engine-scoped-retention.ts';
import {engineScopedRanking} from '../lib/server/engine-scoped-ranking.ts';
import {LEGACY_PHYSICS,resolvePhysicsEngine} from '../lib/physics/engine-version.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import * as ranking from '../lib/server/leaderboard-ranking.ts';
import {retainRunHistorySQL,pruneRunHistorySQL} from '../lib/server/run-history.ts';
import {pruneSharedReplaysSQL} from '../lib/server/shared-replay-retention.ts';
import {ROUTE_ASSESSMENT_VERSION} from '../lib/server/route-assessment-version.ts';
import {GLOBAL_SCORE_RULES,scoreString,scoreTicks,sharedScoreFile} from '../lib/game/global-score-format.ts';

test('score submission requires consent and atomically retains its public recording',async()=>{
 const db=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 let failAt:string|undefined;
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return db.prepare(sql).get(...args as never[]);},async all(){return {results:db.prepare(sql).all(...args as never[])};},run(){if(failAt&&sql.startsWith(failAt))throw Error('Storage unavailable');return db.prepare(sql).run(...args as never[]);}};},async batch(statements:{run:()=>unknown}[]){db.exec('BEGIN');try{const rows=statements.map(s=>s.run());db.exec('COMMIT');return rows;}catch(e){db.exec('ROLLBACK');throw e;}}};
 const record=Array(52).fill(0);record[0]=65;record[50]=100;
 let verified={physicsEngine:'ms-1990' as 'ms-1990'|'bb-1991'|'ms-1991',id:'a'.repeat(64),trackHash:'b'.repeat(64),carCode:'PMIN',ticks:100,record,routeAssessment:'full_route',replay:new Uint8Array(2000)};
 const source=readFileSync(new URL('../lib/server/highscore-handler.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
const deps={assertRaceEngineIdentity,resolvePhysicsEngine,engineScopedRanking,LEGACY_PHYSICS,engineScopedRetention,raceEngineStatements,boundedRequestText,env:{DB:binding,ASSETS:{}},GLOBAL_SCORE_RULES,scoreHash:async()=> 'bucket',scoreString,validateScoreSubmission:()=>{},sharedScoreFile,publicScoreName:(s:string)=>s,verifyGlobalScore:async()=>verified,globalScoreData:async()=>({}),retainRunHistorySQL,pruneRunHistorySQL,pruneSharedReplaysSQL,ROUTE_ASSESSMENT_VERSION,...ranking};
 const post=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return POST;')(...Object.values(deps)) as (r:Request)=>Promise<Response>;
 const get=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return GET;')(...Object.values(deps)) as (r:Request)=>Promise<Response>;
 const send=(consent:boolean)=>post(new Request('https://example.test/api/highscores',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES},body:JSON.stringify({replay:Array(24).fill(0),publicReplayConsent:consent})}));
 assert.equal((await send(false)).status,422);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM global_scores').get()!.n,0);
 assert.equal((await send(true)).status,200);assert.ok(db.prepare('SELECT id FROM shared_replays WHERE id=?').get(verified.id));
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM race_engines').get()!.n,0);
 const legacyId=verified.id;
 const snapshot=()=>['global_scores','run_history','shared_replays'].map(table=>db.prepare('SELECT * FROM '+table+' WHERE id=?').get(legacyId));
 const legacyBefore=snapshot();
 const legacyOrphan='2'.repeat(64),modernOrphan='3'.repeat(64);
 db.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run(legacyOrphan,'[7,8,9]','OLDTRACK',3);
 const legacyOrphanBefore=db.prepare('SELECT * FROM shared_replays WHERE id=?').get(legacyOrphan);
 for(let i=0;i<7;i++){
  verified={...verified,id:'e'.repeat(63)+i,physicsEngine:'ms-1991',ticks:90-i};
  assert.equal((await send(true)).status,200);
  assert.deepEqual(snapshot(),legacyBefore,'Modern submissions cannot rewrite or evict legacy rows');
  assert.deepEqual(db.prepare('SELECT * FROM shared_replays WHERE id=?').get(legacyOrphan),legacyOrphanBefore,'Modern POST must preserve historical legacy orphan recordings');
 }
 db.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run(modernOrphan,'[10,11,12]','NEWTRACK',4);
 db.prepare('INSERT INTO race_engines(id,physics_engine) VALUES (?,?)').run(modernOrphan,'ms-1991');
 const modernOrphanBefore=db.prepare('SELECT * FROM shared_replays WHERE id=?').get(modernOrphan);
 verified={...verified,id:'d'.repeat(64),physicsEngine:'bb-1991'};
 assert.equal((await send(true)).status,200);
 assert.equal(db.prepare('SELECT physics_engine FROM race_engines WHERE id=?').get(verified.id)!.physics_engine,'bb-1991');
 assert.deepEqual(snapshot(),legacyBefore);
 assert.deepEqual(db.prepare('SELECT * FROM shared_replays WHERE id=?').get(legacyOrphan),legacyOrphanBefore);
 assert.deepEqual(db.prepare('SELECT * FROM shared_replays WHERE id=?').get(modernOrphan),modernOrphanBefore,'Third-engine POST must preserve both other-engine orphan libraries');
 for(const engine of [undefined,'ms-1990','ms-1991','bb-1991']){
  const response=await get(new Request('https://example.test/api/highscores?track='+verified.trackHash+(engine?'&engine='+engine:'')));
  assert.equal(response.status,200);
  const body=await response.json() as {file:number[]};assert.equal(body.file.length,364);
 }
 assert.equal((await get(new Request('https://example.test/api/highscores?track='+verified.trackHash+'&engine=latest'))).status,400);
 for(const [index,engine] of ['ms-1990','ms-1991'].entries()){
  const exploitRecord=record.slice();exploitRecord[0]=88;exploitRecord[50]=25;
  verified={...verified,id:'f'.repeat(63)+index,physicsEngine:engine as 'ms-1990'|'ms-1991',ticks:25,record:exploitRecord,routeAssessment:'shortcuts_detected'};
  assert.equal((await send(true)).status,200,'Verified exploit runs must be accepted, not rejected');
  assert.equal(db.prepare('SELECT route_assessment FROM global_scores WHERE id=?').get(verified.id)!.route_assessment,'shortcuts_detected');
  assert.ok(db.prepare('SELECT id FROM shared_replays WHERE id=?').get(verified.id),'Accepted exploit recording must remain downloadable');
  for(const category of ['shortcuts_detected','full_route']){
   const response=await get(new Request(`https://example.test/api/highscores?track=${verified.trackHash}&engine=${engine}&category=${category}`));
   assert.equal(response.status,200);
   const body=await response.json() as {file:number[]};
   const contains=Array.from({length:7},(_,i)=>scoreTicks(body.file.slice(i*52,(i+1)*52))).includes(25);
   assert.equal(contains,category==='shortcuts_detected','Exploit result appears only in its category board');
  }
 }
 const protectedTables=['global_scores','accepted_scores','run_history','shared_replays','race_engines'];
 const protectedSnapshot=()=>protectedTables.map(table=>db.prepare('SELECT * FROM '+table+' ORDER BY id').all());
 verified={...verified,id:'9'.repeat(64),physicsEngine:'ms-1991'};
 db.prepare('INSERT INTO race_engines(id,physics_engine) VALUES (?,?)').run(verified.id,'bb-1991');
 let protectedBefore=protectedSnapshot();
 assert.equal((await send(true)).status,503,'A retained conflicting engine must prevent acceptance, not merely ignore the new tag');
 assert.deepEqual(protectedSnapshot(),protectedBefore,'Conflicting metadata must not change historical score/replay rows');
 verified={...verified,id:'8'.repeat(64)};
 db.prepare('INSERT INTO accepted_scores(id,rules,created_at) VALUES (?,?,?)').run(verified.id,GLOBAL_SCORE_RULES,5);
 protectedBefore=protectedSnapshot();
 assert.equal((await send(true)).status,503,'Missing modern metadata on a retained record must not be silently inferred or repaired');
 assert.deepEqual(protectedSnapshot(),protectedBefore);
 verified={...verified,id:'c'.repeat(64)};
 // Rate limiting deliberately counts failed attempts outside the acceptance
 // transaction. It is not score/history data and must not roll back on failure.
 const allTables=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name<>'score_requests' ORDER BY name").all().map(row=>String(row.name));
 const allRows=()=>allTables.map(table=>({table,rows:db.prepare('SELECT * FROM '+table+' ORDER BY rowid').all()}));
 // Begin an independent fault-injection phase below the real 20-attempt cap.
 // This reset is isolated test setup, never an application operation.
 db.exec('UPDATE score_requests SET count=0');
 for(const operation of ['INSERT OR IGNORE INTO race_engines','INSERT INTO global_scores','INSERT OR IGNORE INTO accepted_scores','INSERT OR IGNORE INTO run_history','DELETE FROM run_history','DELETE FROM global_scores','INSERT OR IGNORE INTO shared_replays','DELETE FROM shared_replays']){
  const beforeFailure=allRows(),requestsBefore=Number(db.prepare('SELECT count FROM score_requests').get()!.count);failAt=operation;
  assert.equal((await send(true)).status,503,operation);
  assert.deepEqual(allRows(),beforeFailure,'Failed transaction must restore every table, including pruning and historical replay bytes: '+operation);
  assert.equal(db.prepare('SELECT count FROM score_requests').get()!.count,requestsBefore+1,'Failed attempts still count toward the abuse limit');
  assert.equal(db.prepare('SELECT id FROM race_engines WHERE id=?').get(verified.id),undefined);
 }
 failAt=undefined;
 assert.equal((await send(true)).status,200,'A clean retry after each rollback must still accept the same proof');
 assert.equal(db.prepare('SELECT physics_engine FROM race_engines WHERE id=?').get(verified.id)!.physics_engine,'ms-1991');
 // An admitted queue proof must not inherit the worker/viewer's public limit.
 // Client-controlled headers and payload flags must never select this path.
 db.exec('UPDATE score_requests SET count=999');
 const requestsBefore=db.prepare('SELECT * FROM score_requests ORDER BY bucket').all();
 const forged=await post(new Request('https://example.test/api/highscores',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES,'X-Stunts-Admitted':'1','X-Stunts-Internal':'1'},body:JSON.stringify({replay:Array(24).fill(0),publicReplayConsent:true,admitted:true})}));
 assert.equal(forged.status,429,'HTTP callers cannot bypass public admission');
 const afterPublicAttempt=db.prepare('SELECT * FROM score_requests ORDER BY bucket').all();
 assert.notDeepEqual(afterPublicAttempt,requestsBefore);
 let checks=0,invalid=false;
 const internalDeps={...deps,verifyGlobalScore:async()=>{checks++;if(invalid)throw Error('Replay does not verify the submitted finish time');return verified;}};
 const accept=new Function(...Object.keys(internalDeps),stripTypeScriptTypes(source)+';return acceptQueuedScore;')(...Object.values(internalDeps)) as (raw:unknown,origin:string)=>Promise<Response>;
 const proof={replay:Array(24).fill(0),publicReplayConsent:true};
 const retainedBefore=protectedSnapshot();
 assert.equal((await accept(proof,'https://example.test')).status,200);
 assert.equal(checks,1,'Internal continuation still runs the full verifier');
 assert.deepEqual(protectedSnapshot(),retainedBefore,'Idempotent continuation preserves existing score and recording rows');
 assert.deepEqual(db.prepare('SELECT * FROM score_requests ORDER BY bucket').all(),afterPublicAttempt,'Verification consumes no second submission allowance');
 invalid=true;
 assert.equal((await accept(proof,'https://example.test')).status,422,'Invalid queued proofs cannot be accepted');
 assert.equal((await accept({...proof,publicReplayConsent:false},'https://example.test')).status,422);
 assert.deepEqual(protectedSnapshot(),retainedBefore);
 db.close();
});
