import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGlobalScoreClient} from '../lib/game/browser-global-scores.ts';
import {sharedScoreFile,GLOBAL_SCORE_RULES,scoreTicks} from '../lib/game/global-score-format.ts';
import {finishedScoreFixture} from './global-score-fixture.ts';
import type {NativeStoredFile} from '../lib/game/native-file-store.ts';
test('background submission durably queues and returns while verification is still blocked',async()=>{
 const proof=await finishedScoreFixture(),saved=new Map<string,NativeStoredFile>();let release!:()=>void,posted=false;
 const gate=new Promise<void>(resolve=>{release=resolve;});
 const persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const request:typeof fetch=async(_url,init)=>{if(init?.method==='POST'){posted=true;await gate;}return Response.json({rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile([]))});};
 const client=await createGlobalScoreClient(persistence,request,()=>true);
 assert.equal(await client.submit(proof,true),'pending');assert.equal(posted,true);
 assert.ok([...saved.values()].some(file=>file.key.startsWith('PENDING:')&&file.bytes.length));
 await client.read(Uint8Array.from(proof.replay.slice(24,0x722)));
 release();await client.flush();assert.ok([...saved.values()].filter(file=>file.key.startsWith('PENDING:')).every(file=>!file.bytes.length));
});
test('offline score survives closing/reopening and retries without importing local HIG files',async()=>{
 const saved=new Map<string,NativeStoredFile>(),persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const proof=await finishedScoreFixture();let online=false,posted=0;
 const request:typeof fetch=async(_url,init)=>{if(!online)throw Error('Offline');if(init?.method==='POST')posted++;return Response.json({rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile(posted?[proof.record]:[]))});};
 const first=await createGlobalScoreClient(persistence,request);assert.equal(await first.submit(proof),'pending');first.close();
 const second=await createGlobalScoreClient(persistence,request),track=Uint8Array.from(proof.replay.slice(24,0x722));
 assert.equal(scoreTicks((await second.read(track)).slice(0,52)),scoreTicks(proof.record));
 online=true;await second.flush();assert.equal(posted,1);await second.flush();assert.equal(posted,1);
 assert.equal(scoreTicks((await second.read(track)).slice(0,52)),scoreTicks(proof.record));
 await assert.rejects(second.submit({...proof,continued:true}));assert.equal(posted,1);
});
test('accepted ranked proofs are retained privately for optional sharing',async()=>{
 const saved=new Map<string,NativeStoredFile>(),persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const proof=await finishedScoreFixture(),id='a'.repeat(64);
 const request:typeof fetch=async()=>Response.json({id,ranked:true,rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile([proof.record]))});
 const client=await createGlobalScoreClient(persistence,request);assert.equal(await client.submit(proof),'accepted');
 assert.deepEqual(JSON.parse(new TextDecoder().decode(saved.get('VERIFIED:'+id)!.bytes)),proof);
 assert.ok([...saved].filter(([key])=>key.startsWith('PENDING:')).every(([,file])=>file.bytes.length===0));
});
test('verified non-ranking runs keep their private proof for later reassessment',async()=>{
 const saved=new Map<string,NativeStoredFile>(),persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const proof=await finishedScoreFixture(),id='b'.repeat(64);
 const request:typeof fetch=async()=>Response.json({id,ranked:false,rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile([]))});
 const client=await createGlobalScoreClient(persistence,request);assert.equal(await client.submit(proof),'accepted');
 assert.deepEqual(JSON.parse(new TextDecoder().decode(saved.get('VERIFIED:'+id)!.bytes)),proof);
 assert.ok([...saved].filter(([key])=>key.startsWith('PENDING:')).every(([,file])=>file.bytes.length===0));
});
test('declining public consent uploads and queues nothing',async()=>{
 const proof=await finishedScoreFixture(),saved=new Map<string,NativeStoredFile>();let posts=0;
 const persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const client=await createGlobalScoreClient(persistence,async()=>{posts++;throw Error('Unexpected upload');},()=>false);
 assert.equal(await client.submit(proof),'rejected');assert.equal(saved.size,0);assert.equal(posts,0);
 saved.set('PENDING:legacy',{key:'PENDING:legacy',bytes:new TextEncoder().encode(JSON.stringify({submission:proof,hash:'a'.repeat(64)}))});
 const reopened=await createGlobalScoreClient(persistence,async()=>{posts++;throw Error('Unexpected upload');},()=>true);
 await reopened.flush();assert.equal(posts,0);assert.ok(saved.get('PENDING:legacy')?.bytes.length);
});
test('score and replay use one consented request even for a slower attempt',async()=>{
 const proof=await finishedScoreFixture(),id='c'.repeat(64),saved=new Map<string,NativeStoredFile>();let posts=0;
 const persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const request:typeof fetch=async(url,init)=>{assert.equal(String(url),'/api/highscores');posts++;assert.equal(JSON.parse(String(init?.body)).publicReplayConsent,true);return Response.json({id,ranked:false,rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile([]))});};
 const client=await createGlobalScoreClient(persistence,request,()=>true);assert.equal(await client.submit(proof),'accepted');assert.equal(posts,1);assert.ok(saved.get('SHARED:'+id)?.bytes.length);
});
