import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGlobalScoreClient} from '../lib/game/browser-global-scores.ts';
import {GLOBAL_SCORE_RULES,sharedScoreFile} from '../lib/game/global-score-format.ts';
import {finishedScoreFixture} from './global-score-fixture.ts';
import type {NativeStoredFile} from '../lib/game/native-file-store.ts';
test('server-queued run survives browser reopen and finalizes automatically without a second public run',async()=>{
 const proof=await finishedScoreFixture(),saved=new Map<string,NativeStoredFile>(),id='a'.repeat(64),verifiedId='b'.repeat(64);let state='verifying',queues=0,checks=0;
 const persistence={all:async()=>[...saved.values()],put:async(f:NativeStoredFile)=>{saved.set(f.key,structuredClone(f));}};
 const request:typeof fetch=async(url,init)=>{
  if(String(url)==='/api/highscores'&&init?.method==='POST'){queues++;assert.equal(new Headers(init.headers).get('X-Stunts-Queue'),'1');return Response.json({submissionId:id,state,verifiedId:state==='accepted'?verifiedId:undefined},{status:202});}
  if(String(url)==='/api/score-submissions'){checks++;return Response.json({state:'busy'});}
  if(String(url)==='/api/score-submissions?id='+id)return Response.json({state});
  if(String(url).startsWith('/api/highscores?'))return Response.json({rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile([proof.record]))});
  throw Error('Unexpected request '+url);
 };
 const first=await createGlobalScoreClient(persistence,request);assert.equal(await first.submit(proof),'pending');assert.equal(checks,1);first.close();
 const pending=[...saved.values()].filter(f=>f.key.startsWith('PENDING:')&&f.bytes.length);assert.equal(pending.length,1);
 state='accepted';const reopened=await createGlobalScoreClient(persistence,request);await reopened.flush();assert.equal(queues,2);assert.equal(checks,1,'An accepted receipt must not re-run verification');
 assert.ok(saved.get('VERIFIED:'+verifiedId)?.bytes.length);assert.ok(saved.get('SHARED:'+verifiedId)?.bytes.length);assert.equal(saved.get(pending[0].key)!.bytes.length,0);await reopened.flush();assert.equal(queues,2);reopened.close();
});
test('queued rejection retains the private recording and never marks it verified or shared',async()=>{
 const proof=await finishedScoreFixture(),saved=new Map<string,NativeStoredFile>();
 const client=await createGlobalScoreClient({all:async()=>[],put:async f=>{saved.set(f.key,structuredClone(f));}},async()=>Response.json({submissionId:'c'.repeat(64),state:'rejected'},{status:202}));
 assert.equal(await client.submit(proof),'rejected');assert.ok([...saved].some(([key,file])=>key.startsWith('REJECTED:')&&file.bytes.length));assert.ok(![...saved.keys()].some(k=>k.startsWith('VERIFIED:')||k.startsWith('SHARED:')));client.close();
});
