/** Synthetic recent-race combinations in the isolated checkout database only. */
import assert from 'node:assert/strict';
import {DatabaseSync,backup} from 'node:sqlite';
import {realpathSync,mkdtempSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
import {driverKey} from '../lib/server/leaderboard-ranking.ts';
import {recentRacesSQL,recentRace,type RecentRaceRow} from '../lib/server/recent-races.ts';
import {withdrawnCommunityTracks} from '../lib/server/withdrawn-community-tracks.ts';
const root=realpathSync(new URL('..',import.meta.url));
assert.ok(process.argv[2],'Provide isolated preview database');
const target=realpathSync(resolve(root,process.argv[2]));
assert.ok(target.startsWith(root+'/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/'));assert.match(target,/\/[a-f0-9]{64}\.sqlite$/);
const db=new DatabaseSync(target),before=db.prepare('SELECT * FROM global_scores ORDER BY id').all();
const track=db.prepare('SELECT track_hash,MIN(ticks) AS best FROM global_scores WHERE rules=? GROUP BY track_hash ORDER BY track_hash').all(GLOBAL_SCORE_RULES).find(r=>!withdrawnCommunityTracks.includes(r.track_hash as never));assert.ok(track);
const backupPath=join(mkdtempSync(join(tmpdir(),'playstunts-recent-combinations-')),'before.sqlite');await backup(db,backupPath);
const now=Math.floor(Date.now()/1000),base=Number(track.best);
function add(name:string,ticks:number,stamp:number,assessment:string,suffix:string){
 const id=createHash('sha256').update('recent-combination-v1:'+suffix).digest('hex'),record=Array(52).fill(0);
 for(const [offset,text] of [[0,name],[17,'Porsche/March INDY']] as const)for(const [i,c] of [...text].entries())record[offset+i]=c.charCodeAt(0);
 record[50]=ticks&255;record[51]=ticks>>>8;
 const inserted=db.prepare('INSERT OR IGNORE INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment) VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,track!.track_hash,'PMIN',ticks,JSON.stringify(record),stamp,driverKey(record,id),assessment);
 if(inserted.changes)db.prepare('INSERT INTO race_engines VALUES (?,?)').run(id,'ms-1991');
}
db.exec('BEGIN IMMEDIATE');
try{
 add('DEMO IMPROVED',base+900,now-900,'full_route','improve-old');
 add('DEMO SHORTCUT',base+800,now-900,'shortcuts_detected','shortcut-old');
 add('DEMO UNCERTAIN',base+700,now-900,'not_assessed','uncertain-old');
 add('DEMO RECORD',Math.max(1,base-20),now-1,'full_route','record');
 add('DEMO IMPROVED',base+600,now-2,'full_route','improved');
 add('DEMO VALID',base+500,now-3,'full_route','valid');
 add('DEMO INVALID',base+400,now-4,'shortcuts_detected','invalid');
 add('DEMO UNASSESSED',base+300,now-5,'not_assessed','unassessed');
 add('DEMO SHORTCUT',base+500,now-6,'shortcuts_detected','shortcut-improved');
 add('DEMO UNCERTAIN',base+400,now-7,'not_assessed','uncertain-improved');
 for(const row of before)assert.deepEqual(db.prepare('SELECT * FROM global_scores WHERE id=?').get(row.id as string),row);
 const races=(db.prepare(recentRacesSQL).all(GLOBAL_SCORE_RULES,JSON.stringify(withdrawnCommunityTracks)) as RecentRaceRow[]).map(recentRace);
 assert.equal(races.length,7);assert.ok(races.some(r=>r.event==='record'&&r.valid));assert.ok(races.some(r=>r.event==='improved'&&!r.valid));
 db.exec('COMMIT');console.log(JSON.stringify({localOnly:true,backupPath,races:races.map(({driver,event,valid,improvement})=>({driver,event,valid,improvement})),existingRowsUnchanged:true}));
}catch(e){db.exec('ROLLBACK');throw e;}finally{db.close();}
