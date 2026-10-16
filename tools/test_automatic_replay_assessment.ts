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
 const db={prepare(query:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return sql.prepare(query).get(...args as never[]);},async all(){return {results:sql.prepare(query).all(...args as never[])};},async run(){return sql.prepare(query).run(...args as never[]);}};},async batch(statements:{run:()=>Promise<unknown>}[]){sql.exec('BEGIN');try{const rows=[];for(const s of statements){const result=await s.run() as {changes:number|bigint};rows.push({success:true,meta:{changes:Number(result.changes)}});}sql.exec('COMMIT');return rows;}catch(e){sql.exec('ROLLBACK');throw e;}}} as unknown as D1Database;
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
test('moving an accepted score into an occupied exploit category never prunes scores or replays',async()=>{
 const {sql,db,result,load}=fixture();
 sql.prepare('INSERT INTO global_scores SELECT ?,rules,track_hash,car_code,?,record,created_at,driver_key,? FROM global_scores WHERE id=?').run('other',2000,'shortcuts_detected','accepted');
 sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run('other','[9,8,7]','THE_EDGE',125);
 const before=sql.prepare('SELECT id,ticks,record,created_at,driver_key FROM global_scores ORDER BY id').all();
 const recordings=sql.prepare('SELECT id,replay,track_name,created_at FROM shared_replays ORDER BY id').all();
 assert.equal((await reassessNextPublicReplay(db,load,async()=>({...result,routeAssessment:'shortcuts_detected',assessmentReason:'branch_switch'}) as never)).state,'updated');
 assert.deepEqual(sql.prepare('SELECT id,ticks,record,created_at,driver_key FROM global_scores ORDER BY id').all(),before);
 assert.deepEqual(sql.prepare('SELECT id,replay,track_name,created_at FROM shared_replays ORDER BY id').all(),recordings);
 assert.equal(sql.prepare('SELECT route_assessment FROM global_scores WHERE id=?').get('accepted')!.route_assessment,'shortcuts_detected');
 sql.close();
});
test('targeted review verifies only an existing accepted public replay, never a client category',async()=>{
 const {sql,db,result,load}=fixture(),target='a'.repeat(64),older='b'.repeat(64);
 sql.prepare('UPDATE global_scores SET id=? WHERE id=?').run(target,'accepted');
 sql.prepare('UPDATE shared_replays SET id=? WHERE id=?').run(target,'accepted');
 sql.prepare('INSERT INTO global_scores SELECT ?,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment FROM global_scores WHERE id=?').run(older,target);
 sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run(older,'[9,8,7]','OTHER',1);
 let calls=0;const verify=async(raw:unknown)=>{calls++;assert.deepEqual((raw as {replay:number[]}).replay,[1,2,3]);return {...result,id:target,routeAssessment:'shortcuts_detected',assessmentReason:'branch_switch'} as never;};
 assert.equal((await reassessNextPublicReplay(db,load,verify,target)).pending,0);
 assert.equal(calls,1);assert.equal(sql.prepare('SELECT assessment_version FROM shared_replays WHERE id=?').get(older)!.assessment_version,'');
 assert.equal((await reassessNextPublicReplay(db,load,verify,'c'.repeat(64))).state,'idle');assert.equal(calls,1);
 await assert.rejects(()=>reassessNextPublicReplay(db,load,verify,"' OR 1=1"),/Invalid public replay ID/);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM shared_replays').get()!.n,2);sql.close();
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
test('failure at each reassessment batch stage rolls back retained data and permits retry',async()=>{
 for(let stage=0;stage<5;stage++){
  const {sql,db,result,load}=fixture();
  sql.exec('INSERT INTO run_history SELECT * FROM global_scores');
  sql.prepare('INSERT INTO race_engines VALUES (?,?)').run('accepted','ms-1991');
  const tables=['global_scores','accepted_scores','run_history','shared_replays','race_engines'];
  const snapshot=()=>tables.map(table=>sql.prepare('SELECT * FROM '+table+' ORDER BY id').all().map(row=>table==='shared_replays'?{...row,assessment_retry_at:0}:row));
  const before=snapshot(),batch=db.batch.bind(db);
  db.batch=(async statements=>batch(statements.map((statement,index)=>index===stage?{run:async()=>{throw Error('Injected batch stage '+stage);}}:statement) as never)) as D1Database['batch'];
  const failed=await reassessNextPublicReplay(db,load,async()=>result as never);
  assert.equal(failed.state,'retry');assert.equal(failed.changed,false);
  assert.deepEqual(snapshot(),before,'Batch failure at stage '+stage+' must preserve every retained row');
  assert.ok(Number(sql.prepare('SELECT assessment_retry_at FROM shared_replays').get()!.assessment_retry_at)>0);
  assert.equal(sql.prepare('SELECT token FROM replay_assessment_lock').get(),undefined);
  db.batch=batch;
  sql.exec('UPDATE shared_replays SET assessment_retry_at=0');
  assert.equal((await reassessNextPublicReplay(db,load,async()=>result as never)).state,'updated');
  assert.equal(sql.prepare('SELECT route_assessment FROM run_history').get()!.route_assessment,'full_route');
  sql.close();
 }
});
test('failed superseded assessment cannot postpone the replacement worker',async()=>{
 const {sql,db,load}=fixture();
 const before=sql.prepare('SELECT * FROM shared_replays').all();
 await reassessNextPublicReplay(db,load,async()=>{
  sql.prepare('UPDATE replay_assessment_lock SET token=?').run('replacement-owner');
  throw Error('Superseded verifier failed');
 });
 assert.deepEqual(sql.prepare('SELECT * FROM shared_replays').all(),before,'Stale failure must not change retry metadata');
 assert.equal(sql.prepare('SELECT token FROM replay_assessment_lock').get()!.token,'replacement-owner');
 sql.close();
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
test('Mindscape reassessment routes the recorded engine and preserves legacy rows',async()=>{
 const {sql,db,result,load}=fixture();
 sql.prepare('INSERT INTO race_engines VALUES (?,?)').run('accepted','ms-1991');
 sql.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run('legacy',GLOBAL_SCORE_RULES,'track','FGTO',3000,'[77,0]',1,'name:marco','full_route');
 sql.exec("INSERT INTO run_history SELECT * FROM global_scores WHERE id='legacy'");
 sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at,assessment_version) VALUES (?,?,?,?,?)').run('legacy','[4,5]','THE_EDGE',1,ROUTE_ASSESSMENT_VERSION);
 const snapshot=()=>['global_scores','run_history','shared_replays'].map(table=>sql.prepare('SELECT * FROM '+table+" WHERE id='legacy'").get());
 const before=snapshot();
 sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run('legacy-orphan','[7,8,9]','OLDTRACK',1);
 const orphanBefore=sql.prepare("SELECT * FROM shared_replays WHERE id='legacy-orphan'").get();
 const update=await reassessNextPublicReplay(db,load,async raw=>{
  assert.equal((raw as {physicsEngine:string}).physicsEngine,'ms-1991');
  return result as never;
 });
 assert.equal(update.state,'updated');assert.deepEqual(snapshot(),before);
 assert.deepEqual(sql.prepare("SELECT * FROM shared_replays WHERE id='legacy-orphan'").get(),orphanBefore,'Automatic modern reassessment must not clean legacy orphan recordings');
 sql.close();
});
test('lost or expired assessment lease cannot update retained data or delete a replacement lease',async()=>{
 for(const mode of ['expired','replaced']){
  const {sql,db,result,load}=fixture();
  sql.prepare('INSERT INTO race_engines VALUES (?,?)').run('accepted','ms-1991');
  const tables=['global_scores','accepted_scores','run_history','shared_replays','race_engines'];
  const snapshot=()=>tables.map(table=>sql.prepare('SELECT * FROM '+table+' ORDER BY id').all());
  const before=snapshot();
  const answer=await reassessNextPublicReplay(db,load,async()=>{
   if(mode==='expired')sql.exec('UPDATE replay_assessment_lock SET lease_until=0');
   else sql.prepare('UPDATE replay_assessment_lock SET token=?').run('replacement-owner');
   return result as never;
  });
  assert.equal(answer.state,'busy');assert.equal(answer.changed,false);
  assert.deepEqual(snapshot(),before,'Losing ownership cannot rewrite any score, replay, history or identity');
  const lock=sql.prepare('SELECT token FROM replay_assessment_lock').get();
  if(mode==='replaced')assert.equal(lock!.token,'replacement-owner','Stale finally cannot release the newer owner');
  else assert.equal(lock,undefined);
  sql.close();
 }
});
test('lease takeover immediately before the write batch cannot rewrite history',async()=>{
 const {sql,db,result,load}=fixture();
 sql.exec('INSERT INTO run_history SELECT * FROM global_scores');
 const before=sql.prepare('SELECT * FROM run_history').all();
 const batch=db.batch.bind(db);
 db.batch=(async statements=>{
  sql.prepare('UPDATE replay_assessment_lock SET token=?').run('new-owner');
  return batch(statements);
 }) as D1Database['batch'];
 const answer=await reassessNextPublicReplay(db,load,async()=>result as never);
 assert.equal(answer.state,'busy');assert.equal(answer.changed,false);
 assert.deepEqual(sql.prepare('SELECT * FROM run_history').all(),before,'Every write, not just the first two, must require current ownership');
 assert.equal(sql.prepare('SELECT token FROM replay_assessment_lock').get()!.token,'new-owner');
 sql.close();
});
