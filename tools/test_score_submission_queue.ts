import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {queueScoreSubmission,publicSubmission,publicSubmissionRows,processScoreSubmission,type SubmissionRow} from '../lib/server/score-submissions.ts';
import {finishedScoreFixture} from './global-score-fixture.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
function fixture(){
 const sql=new DatabaseSync(':memory:');for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 const db={prepare(query:string){let args:unknown[]=[];return {bind(...v:unknown[]){args=v;return this;},async first(){return sql.prepare(query).get(...args as never[])??null;},async all(){return {results:sql.prepare(query).all(...args as never[])};},async run(){return sql.prepare(query).run(...args as never[]);}};}} as unknown as D1Database;
 const row=(id:string)=>sql.prepare('SELECT * FROM score_submissions WHERE id=?').get(id) as SubmissionRow;
 return {sql,db,row};
}
test('queue migration is additive and preserves existing score and replay bytes',()=>{
 const sql=new DatabaseSync(':memory:');const files=readdirSync(new URL('../drizzle/',import.meta.url)).filter(n=>n.endsWith('.sql')).sort();
 for(const name of files.filter(n=>!n.startsWith('0012_')))sql.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 sql.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run('existing',GLOBAL_SCORE_RULES,'original','PMIN',1153,'[1,2,3]',1,'name:original','full_route');
 sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run('existing','[9,8,7]','DEFAULT',1);
 const before=['global_scores','shared_replays'].map(t=>sql.prepare('SELECT * FROM '+t).all());
 sql.exec(readFileSync(new URL('../drizzle/0012_clammy_beast.sql',import.meta.url),'utf8'));
 assert.deepEqual(['global_scores','shared_replays'].map(t=>sql.prepare('SELECT * FROM '+t).all()),before);assert.equal(sql.prepare('SELECT COUNT(*) n FROM score_submissions').get()!.n,0);sql.close();
});
test('public queue is consented, idempotent, unranked, engine-specific and does not expose replay bytes',async()=>{
 const {sql,db}=fixture(),proof=await finishedScoreFixture();
 await assert.rejects(queueScoreSubmission(db,proof,'ip'),/consent/);
 const raw={...proof,publicReplayConsent:true},a=await queueScoreSubmission(db,raw,'ip'),b=await queueScoreSubmission(db,raw,'ip');assert.equal(a.id,b.id);
 const modern=await queueScoreSubmission(db,{...raw,physicsEngine:'ms-1991'},'ip');assert.notEqual(a.id,modern.id);
 assert.equal(sql.prepare('SELECT count FROM score_requests').get()!.count,2,'Idempotent retry does not spend another submission allowance');
 for(const table of ['global_scores','run_history','accepted_scores','shared_replays','race_engines'])assert.equal(sql.prepare('SELECT COUNT(*) n FROM '+table).get()!.n,0,table+' stays untouched until accepted');
 assert.equal((await publicSubmissionRows(db)).length,2);
 const visible=publicSubmission(a);assert.equal(visible.state,'queued');assert.equal(visible.ticks,a.ticks);assert.ok(!('submission' in visible));assert.ok(!('replay' in visible));assert.ok(!('record' in visible));
 assert.equal(JSON.parse(a.submission).publicReplayConsent,true);sql.close();
});
test('verification is leased across visitors, preserves payload and changes status only after an acceptance receipt',async()=>{
 const {sql,db,row}=fixture(),queued=await queueScoreSubmission(db,{...await finishedScoreFixture(),publicReplayConsent:true},'ip');
 let release!:()=>void,started!:()=>void,calls=0;const gate=new Promise<void>(resolve=>release=resolve),ready=new Promise<void>(resolve=>started=resolve),id='a'.repeat(64);
 const first=processScoreSubmission(db,async raw=>{calls++;assert.deepEqual(raw,JSON.parse(queued.submission));started();await gate;sql.prepare('INSERT INTO accepted_scores VALUES (?,?,?)').run(id,GLOBAL_SCORE_RULES,1);return Response.json({accepted:true,id});},queued.id);
 await ready;assert.equal(row(queued.id).state,'verifying');assert.equal((await processScoreSubmission(db,async()=>{calls++;throw Error('duplicate');},queued.id)).state,'busy');assert.equal(calls,1);
 release();assert.equal((await first).state,'accepted');assert.equal(row(queued.id).verified_id,id);assert.equal(row(queued.id).submission,queued.submission);assert.equal((await publicSubmissionRows(db)).length,0);
 assert.equal((await processScoreSubmission(db,async()=>{throw Error('Already checked');},queued.id)).state,'idle');sql.close();
});
test('transient errors retry, expired workers recover, and failed verification never becomes an exploit record',async()=>{
 const {sql,db,row}=fixture(),queued=await queueScoreSubmission(db,{...await finishedScoreFixture(),publicReplayConsent:true},'ip');
 assert.equal((await processScoreSubmission(db,async()=>Response.json({error:'Temporary storage failure'},{status:503}),queued.id)).state,'retry');assert.equal(row(queued.id).state,'retry');
 assert.equal((await processScoreSubmission(db,async()=>{throw Error('Backoff ignored');},queued.id)).state,'idle');
 sql.prepare("UPDATE score_submissions SET state='verifying',retry_at=0 WHERE id=?").run(queued.id);sql.prepare('INSERT INTO replay_assessment_lock VALUES (?,?,?)').run('score-submissions','expired',1);
 assert.equal((await processScoreSubmission(db,async()=>Response.json({error:'Replay does not verify the submitted finish time'},{status:422}),queued.id)).state,'rejected');assert.equal(row(queued.id).state,'rejected');assert.equal(row(queued.id).submission,queued.submission);
 assert.equal(sql.prepare('SELECT COUNT(*) n FROM global_scores').get()!.n,0);assert.equal(sql.prepare('SELECT COUNT(*) n FROM shared_replays').get()!.n,0);assert.equal((await publicSubmissionRows(db))[0].state,'rejected');sql.close();
});
test('unconfirmed acceptance is retried and existing scores, recordings and engine metadata remain unchanged',async()=>{
 const {sql,db,row}=fixture();sql.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run('old',GLOBAL_SCORE_RULES,'oldtrack','PMIN',123,'[1,2]',1,'name:old','full_route');sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run('old','[3,4,5]','OLD',1);
 const before=['global_scores','shared_replays','race_engines'].map(t=>sql.prepare('SELECT * FROM '+t).all());
 const queued=await queueScoreSubmission(db,{...await finishedScoreFixture(),publicReplayConsent:true},'ip');
 assert.equal((await processScoreSubmission(db,async()=>Response.json({accepted:true,id:'b'.repeat(64)}),queued.id)).state,'retry');assert.equal(row(queued.id).state,'retry');
 assert.deepEqual(['global_scores','shared_replays','race_engines'].map(t=>sql.prepare('SELECT * FROM '+t).all()),before);sql.close();
});
test('an older stalled check cannot keep fresh submissions behind it forever',async()=>{
 const {sql,db,row}=fixture(),proof=await finishedScoreFixture();
 const old=await queueScoreSubmission(db,{...proof,publicReplayConsent:true},'ip');
 const record=[...proof.record];record[0]=78;
 const fresh=await queueScoreSubmission(db,{...proof,record,publicReplayConsent:true},'ip');
 sql.prepare("UPDATE score_submissions SET state='verifying',retry_at=0,updated_at=1 WHERE id=?").run(old.id);
 let seen=0;
 assert.equal((await processScoreSubmission(db,async raw=>{seen=(raw as {record:number[]}).record[0];return Response.json({error:'Simulation progress unavailable'},{status:503});})).state,'retry');
 assert.equal(seen,78,'Fresh work precedes an expired stalled attempt');
 assert.equal(row(fresh.id).state,'retry');assert.equal(row(old.id).state,'verifying');
 assert.equal((await processScoreSubmission(db,async()=>{throw Error('Simulation progress unavailable');})).state,'retry');
 assert.equal(row(old.id).state,'retry','Unavailable simulation is deferred, never falsely rejected or accepted');
 assert.equal(row(old.id).submission,old.submission);assert.equal(sql.prepare('SELECT COUNT(*) n FROM shared_replays').get()!.n,0);sql.close();
});
