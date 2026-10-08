import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureData,finishedScoreFixture} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {createNativeFileStore,nativeFileKey} from '../lib/game/native-file-store.ts';
import {createGlobalScoreClient} from '../lib/game/browser-global-scores.ts';
import {createGlobalScoreFileStore,type GlobalScoreContext} from '../lib/game/global-score-file-store.ts';
import {runAllocatedRaceResults} from '../lib/game/native-allocated-race-results.ts';
import {enterNativeHighScoreWithPresentation} from '../lib/game/native-high-score-runtime.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {GLOBAL_SCORE_RULES,sharedScoreFile,scoreString} from '../lib/game/global-score-format.ts';
import {completedScoreProof,namedCompletedScore} from '../lib/game/completed-score-offer.ts';
import type {NativeStoredFile} from '../lib/game/native-file-store.ts';

test('local scores restore distinct slower runs under the same name without reading or writing the public board',async()=>{
 const proof=await finishedScoreFixture(),slower={...proof,record:[...proof.record]};slower.record[50]+=10;
 const saved=new Map<string,NativeStoredFile>([['VERIFIED:a',{key:'VERIFIED:a',bytes:new TextEncoder().encode(JSON.stringify(proof))}],['VERIFIED:b',{key:'VERIFIED:b',bytes:new TextEncoder().encode(JSON.stringify(slower))}]]);
 const client=await createGlobalScoreClient({async all(){return [...saved.values()];},async put(file){saved.set(file.key,file);}},async()=>{throw Error('Local table must never request the public board');});
 const privateFiles=new Map<string,NativeStoredFile>();
 const local=await createNativeFileStore(new Map([[nativeFileKey('','TEST','.TRK'),async()=>Uint8Array.from(proof.replay.slice(24,0x722))]]),{async all(){return [...privateFiles.values()];},async put(file){privateFiles.set(file.key,file);}});
 const files=createGlobalScoreFileStore(local,client,()=>undefined),restored=await files.read('','TEST','.HIG');
 assert.deepEqual(Array.from(restored.slice(0,52)),proof.record);assert.deepEqual(Array.from(restored.slice(52,104)),slower.record);
 assert.deepEqual(await local.read('','TEST','.HIG'),restored,'Restored table is persisted privately');
 await files.write('','TEST','.HIG',restored);assert.deepEqual(await local.read('','TEST','.HIG'),restored);
});

test('top-seven save remains private until the completed-run panel explicitly submits',async()=>{
 const proof=await finishedScoreFixture(),runtime=await createNativeManualRaceRuntime(fixtureData,{configuration:proof.replay.slice(0,24),track:proof.replay.slice(24,0x722),name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 runtime.session.skipIntroduction();for(const input of proof.replay.slice(0x722)){captureOriginalRaceInput(runtime.session.state.memory,0x2d1a0,input);runtime.session.originalMemory.writeMemory(runtime.session.state.memory);runtime.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});}
 const m=runtime.session.state.memory,d=0x2d1a0;let name='';for(let i=0;i<8&&m[d+0x8fcf+i];i++)name+=String.fromCharCode(m[d+0x8fcf+i]);
 let posted=0,board=sharedScoreFile([]);const reads:string[]=[];
 const fasterOverall=sharedScoreFile(Array.from({length:7},(_,i)=>{const record=Array(52).fill(0);record[0]=65+i;record[50]=1;return record;}));
 const persistence={async all(){return [];},async put(){}};
 const local=await createNativeFileStore(new Map([[nativeFileKey('',name,'.TRK'),async()=>Uint8Array.from(proof.replay.slice(24,0x722))]]),persistence);
 const client=await createGlobalScoreClient(persistence,async(url,init)=>{if(init?.method==='POST'){const proof=JSON.parse(String(init.body)),verified=await verifyGlobalScore(proof,fixtureData);if(proof.validateOnly)return Response.json({verified:true,routeAssessment:verified.routeAssessment});posted++;board=sharedScoreFile([Array.from(verified.record)]);return Response.json({rules:GLOBAL_SCORE_RULES,file:Array.from(board)});}reads.push(String(url));return Response.json({rules:GLOBAL_SCORE_RULES,file:Array.from(String(url).includes('&car=PMIN&category=not_assessed')?board:fasterOverall)});});
 let context:GlobalScoreContext|undefined;const files=createGlobalScoreFileStore(local,client,()=>context);
 const split=(filename:string)=>{const slash=filename.lastIndexOf('\\');return {path:filename.slice(0,slash+1),name:filename.slice(slash+1)};};
 await runAllocatedRaceResults(fixtureData,runtime,{progress(){},async readFile(filename){const p=split(filename);return files.exists(p.path,p.name,'')?files.read(p.path,p.name,''):null;},async writeFile(filename,bytes){const p=split(filename);await files.write(p.path,p.name,'',bytes);return 0;},async insertTrackDisk(){return 0;},async present(state,services){
  context={runtime,state,history:{continued:false,inputs:proof.replay.slice(0x722),total:proof.replay.length-0x722,introducing:false}};
  const eligibility=await services.prepareScores!(state);assert.equal(eligibility.status,1);
  const offer=await completedScoreProof(context,eligibility.status);assert.ok(offer);
  await enterNativeHighScoreWithPresentation({drawTable(){},present(){},async editName(){return 'QA DRIVER';},async save(bytes){await services.files.writeScores(bytes);}},state.scores,{time:eligibility.candidateTime,classification:0,carName:state.carName,opponentSelected:state.panel.opponentSelected,opponentCode:state.opponentCode,opponentCarCode:state.opponentCarCode},[],4);
  assert.equal(posted,0,'Original local name entry must not auto-publish or duplicate the website offer');
  await client.submit(namedCompletedScore(offer,'QA DRIVER'),true);
  return 2;
 }});
 await client.flush();
 assert.equal(posted,1);assert.equal(scoreString(board.slice(0,52),0,17),'QA DRIVER');
 assert.ok(!reads.some(url=>url.includes('&category=')),'No pre-submission category assessment is necessary');
 assert.equal((await files.read('',name,'.HIG')).length,364);
});
