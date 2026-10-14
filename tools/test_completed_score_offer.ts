import {test} from 'node:test';
import assert from 'node:assert/strict';
import {completedScoreProof,namedCompletedScore} from '../lib/game/completed-score-offer.ts';
import type {GlobalScoreContext} from '../lib/game/global-score-file-store.ts';
import {finishedScoreFixture,fixtureData} from './global-score-fixture.ts';
import {verifyGlobalScore} from '../lib/server/verify-global-score.ts';
import {scoreTicks,scoreString,sharedScoreFile} from '../lib/game/global-score-format.ts';
test('completed proof retains each recorded engine and snapshots controls before asynchronous replay delivery',async()=>{
 for(const engine of ['ms-1990','ms-1991','bb-1991'] as const){
  const replay=new Uint8Array(0x724);replay[24]=73;
  const inputs=[1,2,4,8];
  let release!:()=>void;
  const waiting=new Promise<void>(resolve=>{release=resolve;});
  const context={state:{panel:{flags:1,playerTime:100,opponentSelected:0,opponentTime:0},carName:'Porsche/March INDY',opponentCode:'',opponentCarCode:''},runtime:{session:{physicsEngine:engine,framesPerSecond:20,async saveReplay(write:(bytes:Uint8Array)=>Promise<number>){await waiting;return write(replay);}}},history:{physicsEngine:engine,continued:false,inputs}} as unknown as GlobalScoreContext;
  const pending=completedScoreProof(context,1);
  inputs.fill(99);release();
  const proof=await pending;assert.ok(proof);
  assert.equal(proof.physicsEngine,engine==='ms-1990'?undefined:engine);
  assert.deepEqual(proof.replay.slice(0x722),[1,2,4,8]);
  assert.equal(new DataView(Uint8Array.from(proof.replay).buffer).getUint16(22,true),4);
  assert.equal(proof.replay[24],73,'Retain the runtime track header');
  assert.equal(namedCompletedScore(proof,'PLAYER').physicsEngine,proof.physicsEngine);
 }
});
test('slower completed run gets a verified proof without replacing local scores',async()=>{
 const fixture=await finishedScoreFixture(),table=sharedScoreFile(Array.from({length:7},()=>{const record=Array(52).fill(0);record[50]=1;return record;})),before=table.slice();
 const context={state:{trackName:'TEST',panel:{flags:1,playerTime:scoreTicks(fixture.record),opponentSelected:0,opponentTime:0},carName:'Porsche/March INDY',opponentCode:'',opponentCarCode:'',scores:{file:table}},runtime:{session:{async saveReplay(write:(bytes:Uint8Array)=>Promise<number>){return write(Uint8Array.from(fixture.replay));}}},history:{continued:false,inputs:fixture.replay.slice(0x722)}} as unknown as GlobalScoreContext;
 const proof=await completedScoreProof(context,0);assert.ok(proof);
 const verified=await verifyGlobalScore(namedCompletedScore(proof,'SLOW DRIVER'),fixtureData);
 assert.equal(verified.ticks,scoreTicks(fixture.record));assert.equal(scoreString(verified.record,0,17),'SLOW DRIVER');assert.deepEqual(table,before);
 const rankingProof=await completedScoreProof(context,1);assert.ok(rankingProof,'Top-seven finishes receive the same public submission offer');
 assert.deepEqual(rankingProof.record,proof.record);assert.deepEqual(table,before);
 context.history!.framesPerSecond=10;assert.equal(await completedScoreProof(context,1),undefined,'Unsupported cadence cannot silently create a20 Hz proof');
 delete context.history!.framesPerSecond;
 context.history!.continued=true;assert.equal(await completedScoreProof(context,0),undefined);
 context.history!.continued=false;context.state.panel.playerTime=0;assert.equal(await completedScoreProof(context,0),undefined);
 context.state.panel.playerTime=scoreTicks(fixture.record);context.state.panel.flags=2;assert.equal(await completedScoreProof(context,0),undefined);
 assert.throws(()=>namedCompletedScore(proof,''));assert.throws(()=>namedCompletedScore(proof,'A'.repeat(17)));
 assert.deepEqual(proof.record.slice(0,17),Array(17).fill(0));
});
