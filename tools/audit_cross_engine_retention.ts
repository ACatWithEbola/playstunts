/** Read-only reproduction using an isolated in-memory database.
 * Unscoped mode reproduces the unsafe baseline; scoped mode checks the
 * implemented retention fix. Neither mode proves production preservation.
 */
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {pruneCarScoresSQL} from '../lib/server/leaderboard-ranking.ts';
import {pruneRunHistorySQL} from '../lib/server/run-history.ts';
import {pruneSharedReplaysSQL} from '../lib/server/shared-replay-retention.ts';
import {engineScopedRetention} from '../lib/server/engine-scoped-retention.ts';
import {resolvePhysicsEngine} from '../lib/physics/engine-version.ts';
const scoped=process.argv.includes('--scoped');
const engine=resolvePhysicsEngine(process.argv.find(value=>value.startsWith('--engine='))?.slice(9)??'ms-1991');
const db=new DatabaseSync(':memory:');
for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
const insert=db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)');
insert.run('legacy','rules','track','PMIN',100,'[1]',1,'name:driver','full_route');
insert.run('modern','rules','track','PMIN',90,'[1]',2,'name:driver','full_route');
db.prepare('INSERT INTO race_engines VALUES (?,?)').run('modern','ms-1991');
db.exec("INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES ('legacy','[1]','DEFAULT',1)");
db.exec("INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES ('modern','[2,3,4]','DEFAULT',2)");
// Historical library rows may have no surviving ranking/history row. Cleanup
// for the other engine must not opportunistically remove those recordings.
db.exec("INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES ('legacy-orphan','[7,8,9]','OLDTRACK',3),('modern-orphan','[10,11,12]','NEWTRACK',4)");
db.prepare('INSERT INTO race_engines VALUES (?,?)').run('modern-orphan','ms-1991');
for(let i=0;i<6;i++)db.prepare('INSERT INTO run_history VALUES (?,?,?,?,?,?,?,?,?)').run(i?'new'+i:'legacy','rules','track','PMIN',100,'[1]',i,'name:driver','full_route');
for(let i=1;i<6;i++)db.prepare('INSERT INTO race_engines VALUES (?,?)').run('new'+i,'ms-1991');
const protectedEngine=engine==='ms-1990'?'ms-1991':'ms-1990';
const protectedRows=()=>['global_scores','run_history','shared_replays'].map(table=>({table,rows:db.prepare(`SELECT * FROM ${table} WHERE COALESCE((SELECT physics_engine FROM race_engines e WHERE e.id=${table}.id),'ms-1990')=? ORDER BY id`).all(protectedEngine)}));
const protectedBefore=protectedRows(),metadataBefore=db.prepare('SELECT * FROM race_engines ORDER BY id').all();
const retention=engineScopedRetention(engine);
db.prepare(scoped?retention.car:pruneCarScoresSQL).run('rules','track','rules','track');
db.prepare(scoped?retention.history:pruneRunHistorySQL).run('rules','track','rules','track');
db.exec(scoped?retention.shared:pruneSharedReplaysSQL);
const remaining=['global_scores','run_history','shared_replays'].map(table=>({table,legacyCount:db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE id='legacy'`).get()?.n}));
assert.ok(remaining.every(row=>row.legacyCount===(scoped?1:0)));
assert.equal(db.prepare("SELECT COUNT(*) AS n FROM run_history WHERE id<>'legacy'").get()?.n,5);
if(scoped){
 assert.deepEqual(protectedRows(),protectedBefore,'Cleanup must preserve every field and replay byte belonging to the other engine');
 assert.deepEqual(db.prepare('SELECT * FROM race_engines ORDER BY id').all(),metadataBefore,'Cleanup must not rewrite engine sidecars');
 const selectedOrphan=engine==='ms-1990'?'legacy-orphan':engine==='ms-1991'?'modern-orphan':undefined,protectedOrphan=engine==='ms-1990'?'modern-orphan':'legacy-orphan';
 if(selectedOrphan)assert.equal(db.prepare('SELECT COUNT(*) AS n FROM shared_replays WHERE id=?').get(selectedOrphan)?.n,0,'Selected-engine orphan cleanup retains its normal policy');
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM shared_replays WHERE id=?').get(protectedOrphan)?.n,1,'Other-engine historical orphan recording must survive');
}
console.log(JSON.stringify({engine,protectedEngine,releaseGate:scoped?'PASS: scoped cleanup preserves other-engine rows and metadata':'FAIL: cross-engine retention removes legacy data',reproduced:true,remaining},null,2));
db.close();
