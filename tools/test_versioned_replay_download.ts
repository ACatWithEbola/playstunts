import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {stripTypeScriptTypes} from 'node:module';
import {readRaceEngine} from '../lib/server/race-engine-metadata.ts';
import {exportVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {sharedReplayTrackName} from '../lib/game/shared-replay-import.ts';
import {GLOBAL_SCORE_RULES,MAX_RANKED_FRAMES,scoreHash} from '../lib/game/global-score-format.ts';
import {validateReplayEncoding} from '../lib/game/upload-validation.ts';
import {replayScoresSQL} from '../lib/server/shared-replay-retention.ts';
test('real download joins preserve ranked and history-only engine identity without exposing orphans',async()=>{
 const sql=new DatabaseSync(':memory:');
 for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(name=>/^\d+.*\.sql$/.test(name)).sort())sql.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 const db={prepare(query:string){assert.ok(query.startsWith('SELECT '),'GET must stay read-only');let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return sql.prepare(query).get(...args as never[]);}};}};
 const source=readFileSync(new URL('../app/api/replays/route.ts',import.meta.url),'utf8').split('export async function POST')[0].replace(/^import .*;\n/gm,'').replace('export async function','async function');
 const deps={env:{DB:db},GLOBAL_SCORE_RULES,MAX_RANKED_FRAMES,scoreHash,validateReplayEncoding,replayScoresSQL,readRaceEngine,exportVersionedReplay,sharedReplayTrackName};
 const GET=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return GET;')(...Object.values(deps)) as (r:Request)=>Promise<Response>;
 const bytes=new Uint8Array(0x722+3);bytes.set(new TextEncoder().encode('PMIN'));bytes[22]=3;bytes.set([1,2,0],0x722);
 const track=await scoreHash(bytes.subarray(24,0x722));
 const tables=['global_scores','accepted_scores','run_history','shared_replays','race_engines'];
 const snapshot=()=>tables.map(table=>sql.prepare('SELECT * FROM '+table+' ORDER BY id').all());
 for(const [index,engine] of ['ms-1990','ms-1991','bb-1991'].entries()){
  const id=String(index+1).repeat(64);
  sql.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,track,'PMIN',3,'[]',1,'name:test','full_route');
  sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run(id,JSON.stringify(Array.from(bytes)),'TEST',1);
  if(engine!=='ms-1990')sql.prepare('INSERT INTO race_engines VALUES (?,?)').run(id,engine);
  for(const historyOnly of [false,true]){
   if(historyOnly){sql.prepare('INSERT INTO run_history SELECT * FROM global_scores WHERE id=?').run(id);sql.prepare('DELETE FROM global_scores WHERE id=?').run(id);}
   const before=snapshot();
   for(const format of ['', '&format=canonical','&format=metadata']){
    const response=await GET(new Request('https://test.example/api/replays?id='+id+format+'&play-engine=ms-1991'));
    assert.equal(response.status,200);
    if(format==='&format=metadata')assert.deepEqual(await response.json(),{physicsEngine:engine});
    else{assert.equal(response.headers.get('X-Stunts-Physics-Engine'),engine);const downloaded=new Uint8Array(await response.arrayBuffer());assert.deepEqual(downloaded.slice(engine==='ms-1990'||format?0x722:0x724),bytes.slice(0x722));}
   }
   assert.deepEqual(snapshot(),before,'Downloads must not alter any retained table');
  }
  sql.prepare('DELETE FROM run_history WHERE id=?').run(id);
  sql.prepare('INSERT INTO accepted_scores VALUES (?,?,?)').run(id,GLOBAL_SCORE_RULES,1);
  assert.equal((await GET(new Request('https://test.example/api/replays?id='+id))).status,404,'Acceptance receipt alone does not expose an orphan recording');
 }
 sql.close();
});
test('download endpoint exports matching format without changing stored recordings',async()=>{
 const stored=new Uint8Array(0x722+5);stored.set(new TextEncoder().encode('PMIN'));stored[22]=5;stored.set([1,4,8,2,0],0x722);
 stored.set(new TextEncoder().encode('DEFAULT'),13);
 const trackHash=await scoreHash(stored.slice(24,0x722));let storedTrackHash=trackHash;
 const original=stored.slice();let engine:string|undefined,payload:unknown=Array.from(stored);
 const expectedDownload=stored.slice();expectedDownload.fill(0,13,22);
 expectedDownload.set(new TextEncoder().encode(sharedReplayTrackName(trackHash)),13);
 const db={prepare(sql:string){assert.ok(sql.startsWith('SELECT '),'Download must never write database records');return {bind(){return this;},async first(){if(sql.startsWith('SELECT physics_engine'))return engine?{physics_engine:engine}:null;return {replay:JSON.stringify(payload),track_hash:storedTrackHash};}};}};
 const source=readFileSync(new URL('../app/api/replays/route.ts',import.meta.url),'utf8').split('export async function POST')[0].replace(/^import .*;\n/gm,'').replace('export async function','async function');
 const deps={env:{DB:db},GLOBAL_SCORE_RULES,MAX_RANKED_FRAMES,scoreHash,validateReplayEncoding,replayScoresSQL,readRaceEngine,exportVersionedReplay,sharedReplayTrackName};
 const GET=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return GET;')(...Object.values(deps)) as (r:Request)=>Promise<Response>;
 const request=(format='')=>GET(new Request('https://test.example/api/replays?id='+ 'a'.repeat(64)+format));
 const legacy=await request();assert.equal(legacy.status,200);assert.equal(legacy.headers.get('X-Stunts-Physics-Engine'),'ms-1990');
 assert.deepEqual(new Uint8Array(await legacy.arrayBuffer()),expectedDownload);
 assert.notDeepEqual(expectedDownload,original,'Public downloads alias the track name and are not raw database backups');
 for(const version of ['bb-1991','ms-1991']){
 engine=version;const modern=await request(),bytes=new Uint8Array(await modern.arrayBuffer());
 assert.equal(modern.headers.get('X-Stunts-Physics-Engine'),version);assert.equal(bytes.length,stored.length+2);assert.equal(bytes[22],20);
 assert.deepEqual(bytes.slice(26),stored.slice(24));
 const canonical=await request('&format=canonical');
 assert.deepEqual(new Uint8Array(await canonical.arrayBuffer()),expectedDownload,
  'Canonical format preserves controls and track data, but still aliases the filename');
 assert.deepEqual(bytes.slice(0,22),expectedDownload.slice(0,22));
 const metadata=await request('&format=metadata');assert.deepEqual(await metadata.json(),{physicsEngine:version});
 const conflictingLaunch=await request('&play-engine=ms-1990&preview-engine=ms-1990');assert.equal(conflictingLaunch.headers.get('X-Stunts-Physics-Engine'),version,'Race launch choice cannot relabel stored download');
 }
 engine=undefined;const legacyOverride=await request('&play-engine=ms-1991');assert.equal(legacyOverride.headers.get('X-Stunts-Physics-Engine'),'ms-1990');
 engine='unknown';
 for(const format of ['', '&format=canonical','&format=metadata']){
  const invalid=await request(format);assert.equal(invalid.status,503);
  assert.equal(invalid.headers.get('Content-Disposition'),null,'Unknown recorded engine must not emit a falsely labelled attachment');
  assert.equal(invalid.headers.get('X-Stunts-Physics-Engine'),null);
 }
 assert.deepEqual(stored,original);
 engine=undefined;
 const malformed:unknown[]=[null,{},[],Array.from(stored).slice(0,-1)];
 for(const value of [256,-1,1.5,'0',null]){const changed:unknown[]=Array.from(stored);changed[4]=value;malformed.push(changed);}
 for(const invalid of malformed){payload=invalid;for(const format of ['', '&format=canonical','&format=metadata']){
  const response=await request(format);assert.equal(response.status,503,'Malformed retained bytes cannot be coerced into a download/compatibility claim');
  assert.equal(response.headers.get('Content-Disposition'),null);assert.equal(response.headers.get('X-Stunts-Physics-Engine'),null);
 }}
 assert.deepEqual(stored,original);
 payload=Array.from(stored);storedTrackHash='0'.repeat(64);
 for(const format of ['', '&format=canonical','&format=metadata'])assert.equal((await request(format)).status,503,'A different embedded track cannot inherit the score track identity');
});
