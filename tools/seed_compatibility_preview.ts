/** Verified playback fixtures, restricted to this checkout's local test DB. */
import assert from 'node:assert/strict';
import {DatabaseSync,backup} from 'node:sqlite';
import {readFileSync,realpathSync,mkdtempSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {fixtureData,finishedScoreFixture} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
import {driverKey} from '../lib/server/leaderboard-ranking.ts';
import {importVersionedReplay} from '../lib/game/versioned-replay-file.ts';

const [database,replayPath,time]=process.argv.slice(2);
if(!database||!replayPath||!time)throw Error('Usage: node tools/seed_compatibility_preview.ts LOCAL_DB MODERN_RPL TICKS');
const root=realpathSync(new URL('..',import.meta.url)),target=realpathSync(resolve(root,database));
assert.ok(target.startsWith(root+'/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/'));
assert.match(target,/\/[a-f0-9]{64}\.sqlite$/);
const source=Uint8Array.from(readFileSync(replayPath)),sourceBefore=source.slice(),ticks=Number(time);
assert.ok(Number.isInteger(ticks)&&ticks>0&&ticks<12000);
const record=Array(52).fill(0);record[0]=84;record[50]=ticks&255;record[51]=ticks>>8;
const proofs=[await finishedScoreFixture(),{record,replay:Array.from(importVersionedReplay(source,'ms-1991')),continued:false,flags:1,rules:GLOBAL_SCORE_RULES,physicsEngine:'ms-1991'}];
const runs=await Promise.all(proofs.map(proof=>verifyGlobalScore(proof,fixtureData)));
assert.deepEqual(source,sourceBefore);
const db=new DatabaseSync(target),snapshots=['global_scores','shared_replays'].map(table=>({table,rows:db.prepare(`SELECT * FROM ${table} ORDER BY id`).all()}));
for(const run of runs)assert.equal(db.prepare('SELECT id FROM global_scores WHERE id=?').get(run.id),undefined,'fixture already exists; do not overwrite');
const backupPath=join(mkdtempSync(join(tmpdir(),'playstunts-preview-seed-backup-')),'before.sqlite');await backup(db,backupPath);
db.exec('BEGIN IMMEDIATE');
try{
 for(const run of runs){
  const now=Math.floor(Date.now()/1000),name=run.physicsEngine==='ms-1991'?'MS91 TEST':'LEGACY TEST';
  db.prepare('INSERT OR IGNORE INTO score_tracks(hash,name) VALUES (?,?)').run(run.trackHash,name);
  db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(run.id,GLOBAL_SCORE_RULES,run.trackHash,run.carCode,run.ticks,JSON.stringify(Array.from(run.record)),now,driverKey(run.record,run.id),run.routeAssessment);
  if(run.physicsEngine!=='ms-1990')db.prepare('INSERT INTO race_engines VALUES (?,?)').run(run.id,run.physicsEngine);
  db.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at,assessment_reason) VALUES (?,?,?,?,?)').run(run.id,JSON.stringify(Array.from(run.replay)),name,now,run.assessmentReason);
  for(const {table,rows} of snapshots)for(const row of rows)assert.deepEqual(db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(row.id as string),row);
 }
 db.exec('COMMIT');
}catch(error){db.exec('ROLLBACK');throw error;}finally{db.close();}
console.log(JSON.stringify({localOnly:true,backupPath,runs:runs.map(({id,physicsEngine,ticks,trackHash})=>({id,physicsEngine,ticks,trackHash})),oldRowsUnchanged:true},null,2));
