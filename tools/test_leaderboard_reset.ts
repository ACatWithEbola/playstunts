import {test} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';
import {backupLeaderboard,purgeLeaderboard,PURGE_TABLES,RESET_ARCHIVE_ID} from '../lib/server/leaderboard-reset.ts';
import {GLOBAL_SCORE_RULES,GLOBAL_SCORE_DATABASE,validateScoreSubmission} from '../lib/game/global-score-format.ts';
function fixture(){
 const sql=new DatabaseSync(':memory:');for(const f of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>/^\d+.*\.sql$/.test(f)).sort())sql.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
 sql.exec("INSERT INTO global_scores VALUES ('score','old','track','PMIN',100,'[]',1,'name:marco','not_assessed'); INSERT INTO accepted_scores VALUES ('score','old',1); INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES ('score','[1,2,3]','DEFAULT',1); INSERT INTO run_history VALUES ('score','old','track','PMIN',100,'[]',1,'name:marco','not_assessed'); INSERT INTO score_requests VALUES ('request',1,20); INSERT INTO replay_assessment_lock VALUES ('lock','token',20); INSERT INTO score_tracks VALUES ('track','DEFAULT'); INSERT INTO shared_tracks VALUES ('community','CUSTOM','[4,5,6]',2);");
 const db={prepare(query:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return sql.prepare(query).get(...args as never[]);},async run(){const result=sql.prepare(query).run(...args as never[]);return {meta:{changes:Number(result.changes)}};}};},async batch(statements:{run:()=>Promise<unknown>}[]){sql.exec('BEGIN');try{const result=[];for(const s of statements)result.push(await s.run());sql.exec('COMMIT');return result;}catch(e){sql.exec('ROLLBACK');throw e;}}};return {sql,db:db as unknown as D1Database};
}
test('reset keeps a complete private backup, purges score data and preserves every track',async()=>{
 const {sql,db}=fixture();await assert.rejects(()=>purgeLeaderboard(db,10,'missing'),/Backup required/);
 const archive=await backupLeaderboard(db,10);const tables=JSON.parse(archive!.payload).tables;assert.equal(Object.keys(tables).length,8);assert.equal(tables.shared_replays[0].replay,'[1,2,3]');
 assert.deepEqual(await purgeLeaderboard(db,11,'nonce'),{purged:true});for(const t of PURGE_TABLES)assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM '+t).get()!.n,0);
 assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM shared_tracks').get()!.n,1);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM score_tracks').get()!.n,1);assert.equal(sql.prepare('SELECT payload FROM leaderboard_reset_backups WHERE id=?').get(RESET_ARCHIVE_ID)!.payload,archive!.payload);
 sql.exec("INSERT INTO global_scores VALUES ('new','new','track','PMIN',101,'[]',12,'name:new','full_route')");assert.deepEqual(await purgeLeaderboard(db,13,'another'),{alreadyPurged:true});assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM global_scores').get()!.n,1);sql.close();
});
test('data changing after backup prevents deletion of unarchived submissions',async()=>{
 const {sql,db}=fixture();await backupLeaderboard(db,10);sql.exec("INSERT INTO accepted_scores VALUES ('new','old',11)");await assert.rejects(()=>purgeLeaderboard(db,12,'nonce'),/Database changed/);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM global_scores').get()!.n,1);assert.equal(sql.prepare('SELECT purged_at FROM leaderboard_reset_backups').get()!.purged_at,0);sql.close();
});
test('old queued submissions cannot enter the new generation and cached boards are isolated',()=>{
 assert.notEqual(GLOBAL_SCORE_DATABASE,'stunts-global-highscores');assert.notEqual(GLOBAL_SCORE_RULES,'ms-dec1990-global-1');assert.throws(()=>validateScoreSubmission({rules:'ms-dec1990-global-1',record:Array(52).fill(0),replay:Array(1900).fill(0),continued:false,flags:1}),/Invalid score/);
});
