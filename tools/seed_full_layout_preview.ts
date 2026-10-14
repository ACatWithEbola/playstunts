/** Synthetic display fixtures only. No replay proofs or production access. */
import assert from 'node:assert/strict';
import {DatabaseSync,backup} from 'node:sqlite';
import {realpathSync,mkdtempSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
import {driverKey} from '../lib/server/leaderboard-ranking.ts';
const root=realpathSync(new URL('..',import.meta.url));
assert.ok(process.argv[2],'Provide the isolated local SQLite database');
const target=realpathSync(resolve(root,process.argv[2]));
assert.ok(target.startsWith(root+'/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/'));
assert.match(target,/\/[a-f0-9]{64}\.sqlite$/);
const db=new DatabaseSync(target);
const originals=db.prepare('SELECT * FROM global_scores ORDER BY id').all();
const replaySnapshot=db.prepare('SELECT * FROM shared_replays ORDER BY id').all();
const tracks=db.prepare('SELECT track_hash,MIN(ticks) AS fastest FROM global_scores WHERE rules=? GROUP BY track_hash').all(GLOBAL_SCORE_RULES);
assert.ok(tracks.length,'Local preview must already contain known tracks');
const backupPath=join(mkdtempSync(join(tmpdir(),'playstunts-full-layout-backup-')),'before.sqlite');
await backup(db,backupPath);
const cars=[['PMIN','Porsche/March INDY'],['COUN','Lamborghini Countach'],['AUDI','Audi Quattro Sport']];
let inserted=0;
db.exec('BEGIN IMMEDIATE');
try{
 for(const track of tracks)for(const engine of ['ms-1990','ms-1991'])for(let i=0;i<20;i++){
  const name='DEMO '+String(i+1).padStart(2,'0'),[car,carName]=cars[i%cars.length];
  const ticks=Number(track.fastest)+100+i*47,record=Array(52).fill(0);
  for(const [offset,text] of [[0,name],[17,carName]] as const)for(const [j,c] of [...text].entries())record[offset+j]=c.charCodeAt(0);
  record[50]=ticks&255;record[51]=ticks>>>8;
  const id=createHash('sha256').update('local-layout-v1:'+track.track_hash+':'+engine+':'+i).digest('hex');
  const result=db.prepare('INSERT OR IGNORE INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment) VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,track.track_hash,car,ticks,JSON.stringify(record),Math.floor(Date.now()/1000)-i*45,driverKey(record,id),'full_route');
  if(result.changes){inserted++;if(engine==='ms-1991')db.prepare('INSERT INTO race_engines(id,physics_engine) VALUES (?,?)').run(id,engine);}
 }
 for(const row of originals)assert.deepEqual(db.prepare('SELECT * FROM global_scores WHERE id=?').get(row.id as string),row);
 assert.deepEqual(db.prepare('SELECT * FROM shared_replays ORDER BY id').all(),replaySnapshot);
 db.exec('COMMIT');
}catch(e){db.exec('ROLLBACK');throw e;}finally{db.close();}
console.log(JSON.stringify({localOnly:true,synthetic:true,tracks:tracks.length,samplesPerTrackPerEngine:20,inserted,backupPath,existingScoresAndReplaysUnchanged:true}));
