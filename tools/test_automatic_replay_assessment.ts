import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {reassessNextPublicReplay} from '../lib/server/reassess-public-replays.ts';
import {ROUTE_ASSESSMENT_VERSION} from '../lib/server/route-assessment-version.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
function fixture(){
 const sql=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>/^\d+.*\.sql$/.test(f)).sort())sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const db={prepare(query:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return sql.prepare(query).get(...args as never[]);},async all(){return {results:sql.prepare(query).all(...args as never[])};},async run(){return sql.prepare(query).run(...args as never[]);}};},async batch(statements:{run:()=>Promise<unknown>}[]){sql.exec('BEGIN');try{const rows=[];for(const s of statements)rows.push(await s.run());sql.exec('COMMIT');return rows;}catch(e){sql.exec('ROLLBACK');throw e;}}} as unknown as D1Database;
 sql.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run('accepted',GLOBAL_SCORE_RULES,'track','FGTO',2517,'[77,0]',123,'name:marco','not_assessed');
 sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run('accepted','[1,2,3]','THE_EDGE',124);
 const result={id:'accepted',trackHash:'track',carCode:'FGTO',ticks:2517,routeAssessment:'full_route',assessmentReason:'full_route'};
 return {sql,db,result,load:async()=>({}) as never};
}
test('automatic assessment changes only category, runs once per version and never imports a private replay',async()=>{
 const {sql,db,result,load}=fixture();let calls=0;
 const verify=async(raw:unknown)=>{calls++;assert.deepEqual((raw as {record:number[]}).record,[77,0]);return result as never;};
 const before=sql.prepare('SELECT * FROM global_scores').get()!;
 const update=await reassessNextPublicReplay(db,load,verify);
 assert.equal(update.state,'updated');assert.equal(update.pending,0);
 assert.equal(sql.prepare('SELECT assessment_reason FROM shared_replays WHERE id=?').get('accepted')!.assessment_reason,'full_route');
 const after=sql.prepare('SELECT * FROM global_scores').get()!;
 assert.deepEqual({...after,route_assessment:before.route_assessment},{...before},'Times, record bytes, driver key and posting date must be immutable');
 assert.equal(after.route_assessment,'full_route');
 assert.equal(sql.prepare('SELECT assessment_version FROM shared_replays').get()!.assessment_version,ROUTE_ASSESSMENT_VERSION);
 assert.equal((await reassessNextPublicReplay(db,load,verify)).state,'idle');assert.equal(calls,1);
 sql.exec("UPDATE shared_replays SET assessment_version='older-verifier'");
 assert.equal((await reassessNextPublicReplay(db,load,verify)).state,'updated');assert.equal(calls,2);
 sql.exec('DELETE FROM shared_replays');
 assert.equal((await reassessNextPublicReplay(db,load,verify)).state,'idle');assert.equal(calls,2,'A score without public recording is not assessable');sql.close();
});
test('simultaneous refreshes share a global lease and expired leases can recover',async()=>{
 const {sql,db,result,load}=fixture();let release!:()=>void,started!:()=>void;
 const ready=new Promise<void>(resolve=>started=resolve),wait=new Promise<void>(resolve=>release=resolve);
 let calls=0;const first=reassessNextPublicReplay(db,load,async()=>{calls++;started();await wait;return result as never;});
 await ready;const concurrent=await reassessNextPublicReplay(db,load,async()=>{calls++;return result as never;});
 assert.equal(concurrent.state,'busy');assert.equal(calls,1);release();assert.equal((await first).state,'updated');
 sql.exec("UPDATE shared_replays SET assessment_version=''; INSERT INTO replay_assessment_lock VALUES ('public-replays','expired',1)");
 assert.equal((await reassessNextPublicReplay(db,load,async()=>result as never)).state,'updated');sql.close();
});
test('verification failure or identity mismatch preserves score and retries later',async()=>{
 const {sql,db,result,load}=fixture(),before=sql.prepare('SELECT * FROM global_scores').get();let calls=0;
 const fail=async()=>{calls++;throw Error('Test resource unavailable');};
 assert.equal((await reassessNextPublicReplay(db,load,fail)).state,'retry');
 assert.deepEqual(sql.prepare('SELECT * FROM global_scores').get(),before);
 assert.equal(sql.prepare('SELECT assessment_version FROM shared_replays').get()!.assessment_version,'');
 assert.equal((await reassessNextPublicReplay(db,load,fail)).state,'idle');assert.equal(calls,1);
 sql.exec('UPDATE shared_replays SET assessment_retry_at=0');
 assert.equal((await reassessNextPublicReplay(db,load,async()=>({...result,id:'different'}) as never)).state,'retry');
 assert.deepEqual(sql.prepare('SELECT * FROM global_scores').get(),before);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM global_scores').get()!.n,1);sql.close();
});
test('history-only slower public replays are reassessed without creating a leaderboard score',async()=>{
 const {sql,db,result,load}=fixture();
 sql.exec('INSERT INTO run_history SELECT * FROM global_scores; DELETE FROM global_scores');
 assert.equal((await reassessNextPublicReplay(db,load,async()=>result as never)).state,'updated');
 assert.equal(sql.prepare('SELECT route_assessment FROM run_history').get()!.route_assessment,'full_route');
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM global_scores').get()!.n,0);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM shared_replays').get()!.n,1);
 sql.close();
});
