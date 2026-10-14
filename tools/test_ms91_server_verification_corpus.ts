/** Explicit read-only completed-race server verification; never accesses DB. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {stripTypeScriptTypes} from 'node:module';
import {resolve,isAbsolute} from 'node:path';
import {fixtureData} from './global-score-fixture.ts';
import {importVersionedReplay,decodeVersionedReplay,exportVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession,createNativeReplayRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readOriginalRaceResultMemory} from '../lib/game/race-result-memory.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES,MAX_RANKED_FRAMES,scoreHash} from '../lib/game/global-score-format.ts';
import {validateReplayEncoding} from '../lib/game/upload-validation.ts';
import {versionedRouteTables} from '../lib/game/versioned-route-tables.ts';
import {reassessNextPublicReplay} from '../lib/server/reassess-public-replays.ts';
import {ROUTE_ASSESSMENT_VERSION} from '../lib/server/route-assessment-version.ts';
import {readRaceEngine} from '../lib/server/race-engine-metadata.ts';
import {sharedReplayTrackName} from '../lib/game/shared-replay-import.ts';
import {replayScoresSQL} from '../lib/server/shared-replay-retention.ts';
import {readRecordedTwoCarRace} from '../lib/game/recorded-two-car-race.ts';
const root=process.argv[2];assert.ok(root&&isAbsolute(root),'Provide absolute competition corpus path');
const tablesBefore=JSON.stringify({records:fixtureData.records,points:fixtureData.points});
for(const name of ['zct300/25-MAR.RPL','zct300/18-ERI.RPL','zct299/01-ARG.RPL','zct299/20-STB.RPL']){
 const path=resolve(root,name),source=readFileSync(path),replay=importVersionedReplay(source,'ms-1991');
 const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991',framesPerSecond:20},{configuration:Array.from(replay.slice(0,24)),track:Array.from(replay.slice(24,0x722)),name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 race.session.skipIntroduction();
 let capturedInputs=0,acceptedInputCount=0;
 let acceptedFinishCar:ReturnType<typeof readRecordedTwoCarRace>['player']['driving']['car']|undefined;
 for(const input of replay.slice(0x722)){
  assert.ok(captureOriginalRaceInput(race.session.state.memory,0x2d1a0,input,20).recorded);
  race.session.originalMemory.writeMemory(race.session.state.memory);
  race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
  capturedInputs++;
  if(!acceptedFinishCar&&race.session.state.player.driving.car.grip.crash===3){
   acceptedInputCount=capturedInputs;
   acceptedFinishCar=structuredClone(readRecordedTwoCarRace(race.session.state.memory,0x2d1a0).player.driving.car);
  }
 }
 const panel=readOriginalRaceResultMemory(race.session.state.memory,0x2d1a0).panel;
 assert.ok(panel.playerTime>0,'Reference must finish');
 let saved:Uint8Array|undefined;await race.session.saveReplay(async bytes=>{saved=bytes.slice();return 0;});assert.ok(saved);
 const record=Array(52).fill(0);record[0]=84;record[50]=panel.playerTime&255;record[51]=panel.playerTime>>>8;
 const proof={record,replay:Array.from(saved),continued:false,flags:1,rules:GLOBAL_SCORE_RULES,physicsEngine:'ms-1991'};
 const verified=await verifyGlobalScore(proof,fixtureData);
 assert.ok(acceptedFinishCar);assert.equal(verified.replay.length,0x722+acceptedInputCount,'Canonical acceptance stops at the first completed finish, not later replay-tail motion');
 assert.equal(verified.physicsEngine,'ms-1991');assert.equal(verified.ticks,panel.playerTime);
 const adapted=versionedRouteTables({...fixtureData,physicsEngine:'ms-1991' as const});
 assert.deepEqual(await verifyGlobalScore(proof,adapted),verified,'Selected and preselected route data must agree');
 const legacyIdentity=await scoreHash(Uint8Array.from([...verified.replay,...verified.record]));
 assert.notEqual(verified.id,legacyIdentity,'Modern identity cannot collide with the legacy hash domain');
 assert.equal(verified.id,await scoreHash(Uint8Array.from([...verified.replay,...verified.record,...new TextEncoder().encode('\0physics:ms-1991')])));
 await assert.rejects(verifyGlobalScore({...proof,record:record.map((value,index)=>index===50?(value+1)&255:value)},fixtureData),/finish time/);
 // Exercise the actual reassessment verifier and retention SQL together.
 const sql=new DatabaseSync(':memory:');
 try{
  for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>/^\d+.*\.sql$/.test(f)).sort())sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
  const db={prepare(query:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return sql.prepare(query).get(...args as never[]);},async run(){return sql.prepare(query).run(...args as never[]);}};},async batch(statements:{run:()=>Promise<unknown>}[]){sql.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}catch(error){sql.exec('ROLLBACK');throw error;}}} as unknown as D1Database;
  sql.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(verified.id,GLOBAL_SCORE_RULES,verified.trackHash,verified.carCode,verified.ticks,JSON.stringify(Array.from(verified.record)),123,'name:t','not_assessed');
  sql.prepare('INSERT INTO race_engines VALUES (?,?)').run(verified.id,'ms-1991');
  sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run(verified.id,JSON.stringify(Array.from(verified.replay)),'REF',124);
  sql.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run('legacy-sentinel',GLOBAL_SCORE_RULES,verified.trackHash,verified.carCode,verified.ticks+100,'[77,0]',1,'name:t','full_route');
  sql.exec("INSERT INTO run_history SELECT * FROM global_scores WHERE id='legacy-sentinel'");
  sql.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at,assessment_version) VALUES (?,?,?,?,?)').run('legacy-sentinel','[4,5]','REF',1,ROUTE_ASSESSMENT_VERSION);
  const protectedRows=()=>['global_scores','run_history','shared_replays'].map(table=>sql.prepare('SELECT * FROM '+table+" WHERE id='legacy-sentinel'").get());
  const protectedBefore=protectedRows(),scoreBefore=sql.prepare('SELECT * FROM global_scores WHERE id=?').get(verified.id)!,replayBefore=sql.prepare('SELECT replay FROM shared_replays WHERE id=?').get(verified.id);
  const outcome=await reassessNextPublicReplay(db,async()=>fixtureData);
  assert.equal(outcome.state,'updated','Actual modern proof must survive reassessment identity validation');
  assert.equal(outcome.pending,0);assert.deepEqual(protectedRows(),protectedBefore);
  const scoreAfter=sql.prepare('SELECT * FROM global_scores WHERE id=?').get(verified.id)!;
  assert.deepEqual({...scoreAfter,route_assessment:scoreBefore.route_assessment},{...scoreBefore});
  assert.deepEqual(sql.prepare('SELECT replay FROM shared_replays WHERE id=?').get(verified.id),replayBefore);
  assert.equal(sql.prepare('SELECT physics_engine FROM race_engines WHERE id=?').get(verified.id)!.physics_engine,'ms-1991');
  assert.equal((await reassessNextPublicReplay(db,async()=>fixtureData)).state,'idle');
  const routeSource=readFileSync(new URL('../app/api/replays/route.ts',import.meta.url),'utf8').split('export async function POST')[0].replace(/^import .*;\n/gm,'').replace('export async function','async function');
  const deps={env:{DB:db},GLOBAL_SCORE_RULES,MAX_RANKED_FRAMES,scoreHash,validateReplayEncoding,replayScoresSQL,readRaceEngine,exportVersionedReplay,sharedReplayTrackName};
  const GET=new Function(...Object.keys(deps),stripTypeScriptTypes(routeSource)+';return GET;')(...Object.values(deps)) as (request:Request)=>Promise<Response>;
  const response=await GET(new Request('https://test.example/api/replays?id='+verified.id));
  assert.equal(response.status,200);assert.equal(response.headers.get('X-Stunts-Physics-Engine'),'ms-1991');
  const downloaded=new Uint8Array(await response.arrayBuffer()),decoded=decodeVersionedReplay(downloaded,'ms-1991');
  assert.equal(decoded.framesPerSecond,20);
  assert.deepEqual(decoded.bytes.slice(0x722),verified.replay.slice(0x722),'Download retains all accepted control inputs');
  const downloadedRace=await createNativeReplayRaceSession({...fixtureData,physicsEngine:'ms-1990'}, {configuration:Array.from(decoded.bytes.slice(0,24)),track:Array.from(decoded.bytes.slice(24,0x722)),name:'DOWNLOAD',camera:0,graphics:2,soundEnabled:false},{bytes:decoded.bytes,name:'DOWNLOAD',path:'C:\\',physicsEngine:'ms-1991',framesPerSecond:decoded.framesPerSecond},{resetMouse(){},async key(){return 0;}});
  assert.equal(downloadedRace.session.physicsEngine,'ms-1991');
  downloadedRace.session.seek(0);downloadedRace.session.seek(downloadedRace.session.length);
  assert.deepEqual(readRecordedTwoCarRace(downloadedRace.session.state.memory,0x2d1a0).player.driving.car,acceptedFinishCar,'Accepted download must reproduce the car state at the accepted finish, not post-finish tail motion');
  assert.equal(readOriginalRaceResultMemory(downloadedRace.session.state.memory,0x2d1a0).panel.flags,4);
  assert.deepEqual(sql.prepare('SELECT replay FROM shared_replays WHERE id=?').get(verified.id),replayBefore,'Endpoint export must not rewrite stored bytes');
  assert.deepEqual(protectedRows(),protectedBefore);
 }finally{sql.close();}
 assert.deepEqual(readFileSync(path),source);
 assert.equal(JSON.stringify({records:fixtureData.records,points:fixtureData.points}),tablesBefore);
 console.log(JSON.stringify({reference:name,ticks:verified.ticks,engine:verified.physicsEngine,sourceUnchanged:true,legacyTablesUnchanged:true,actualReassessmentPassed:true}));
}
