/** Read-only HTTP integration check against the local preview and local DB. */
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {fixtureData} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {importVersionedReplay,exportVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {resolvePhysicsEngine} from '../lib/physics/engine-version.ts';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
const [database,...ids]=process.argv.slice(2);
if(!database||ids.length!==2)throw Error('Usage: node tools/check_local_replay_downloads.ts LOCAL_DB LEGACY_ID MS91_ID');
const root=realpathSync(new URL('..',import.meta.url)),target=realpathSync(resolve(root,database));
assert.ok(target.startsWith(root+'/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/'));assert.match(target,/\/[a-f0-9]{64}\.sqlite$/);
const db=new DatabaseSync(target,{readOnly:true});
const snapshot=()=>['global_scores','shared_replays','race_engines'].map(table=>db.prepare(`SELECT * FROM ${table} ORDER BY id`).all());
const before=snapshot();
for(const [index,id] of ids.entries()){
 assert.match(id,/^[a-f0-9]{64}$/);
 const row=db.prepare('SELECT s.record,s.ticks,r.replay FROM global_scores s JOIN shared_replays r ON r.id=s.id WHERE s.id=?').get(id)!;
 assert.ok(row,'local fixture must exist');
 const engine=resolvePhysicsEngine(db.prepare('SELECT physics_engine FROM race_engines WHERE id=?').get(id)?.physics_engine);
 assert.equal(engine,index===0?'ms-1990':'ms-1991');
 const url='http://localhost:5191/api/replays?id='+id;
 const metadata=await fetch(url+'&format=metadata');assert.equal(metadata.status,200);assert.deepEqual(await metadata.json(),{physicsEngine:engine});
 const canonicalResponse=await fetch(url+'&format=canonical');assert.equal(canonicalResponse.status,200);
 const canonical=new Uint8Array(await canonicalResponse.arrayBuffer());
 const response=await fetch(url);assert.equal(response.status,200);assert.equal(response.headers.get('X-Stunts-Physics-Engine'),engine);
 assert.match(response.headers.get('Content-Disposition')??'',/attachment; filename="R[A-F0-9]{7}\.RPL"/);
 const downloaded=new Uint8Array(await response.arrayBuffer()),stored=Uint8Array.from(JSON.parse(row.replay as string));
 assert.deepEqual(downloaded,exportVersionedReplay(canonical,engine));
 const imported=importVersionedReplay(downloaded,engine);
 assert.deepEqual(imported.slice(0,13),stored.slice(0,13));assert.deepEqual(imported.slice(22),stored.slice(22),'all track, count and control bytes must match storage');
 const result=await verifyGlobalScore({record:JSON.parse(row.record as string),replay:Array.from(imported),continued:false,flags:1,rules:GLOBAL_SCORE_RULES,physicsEngine:engine},fixtureData);
 assert.equal(result.ticks,row.ticks);
 assert.deepEqual(snapshot(),before,'HTTP downloads and verification must not modify stored rows');
 console.log(JSON.stringify({id,engine,downloadedBytes:downloaded.length,verifiedTicks:result.ticks,storedRowsUnchanged:true}));
}
db.close();
