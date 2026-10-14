import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGlobalScoreClient} from '../lib/game/browser-global-scores.ts';
import {sharedScoreFile,GLOBAL_SCORE_RULES,scoreTicks,scoreHash} from '../lib/game/global-score-format.ts';
import {finishedScoreFixture} from './global-score-fixture.ts';
import type {NativeStoredFile} from '../lib/game/native-file-store.ts';
test('damaged cached boards cannot break offline reads or erase retained bytes',async()=>{
 const track=new Uint8Array(0x6fa),hash=await scoreHash(track);
 for(const engine of ['ms-1990','ms-1991'] as const)for(const length of [0,51,363,365]){
  const key='BOARD:'+hash+(engine==='ms-1990'?'':':physics:'+engine),bytes=new Uint8Array(length).fill(7);
  const file={key,bytes:bytes.slice()};let writes=0;
  const client=await createGlobalScoreClient({all:async()=>[file],put:async()=>{writes++;}},async()=>{throw Error('Offline');});
  assert.deepEqual(await client.read(track,undefined,undefined,engine),sharedScoreFile([]));
  assert.deepEqual(file.bytes,bytes);assert.equal(writes,0);client.close();
 }
});
test('damaged queued proofs are preserved without blocking valid offline records',async()=>{
 const proof=await finishedScoreFixture(),track=Uint8Array.from(proof.replay.slice(24,0x722)),hash=await scoreHash(track),encoder=new TextEncoder();
 const damaged=new Map<string,Uint8Array>([
  ['PENDING:broken-json',encoder.encode('{broken')],
  ['PENDING:null-envelope',encoder.encode('null')],
  ['PENDING:unknown-engine',encoder.encode(JSON.stringify({submission:{...proof,physicsEngine:'unknown'},hash,publicReplayConsent:true}))],
  ['PENDING:bad-record',encoder.encode(JSON.stringify({submission:{...proof,record:[1,2]},hash,publicReplayConsent:true}))],
  ['PENDING:wrong-track-hash',encoder.encode(JSON.stringify({submission:proof,hash:'0'.repeat(64),publicReplayConsent:true}))],
 ]);
 const saved=new Map<string,NativeStoredFile>([...damaged].map(([key,bytes])=>[key,{key,bytes:bytes.slice()}]));
 saved.set('PENDING:valid',{key:'PENDING:valid',bytes:encoder.encode(JSON.stringify({submission:proof,hash,publicReplayConsent:true}))});
 let posts=0;
 const client=await createGlobalScoreClient({async all(){return [...saved.values()];},async put(file){saved.set(file.key,file);}},async(_url,init)=>{if(init?.method==='POST')posts++;throw Error('Offline');});
 await client.flush();
 for(const [key,bytes] of damaged)assert.deepEqual(saved.get(key)!.bytes,bytes,'Do not erase or rewrite damaged private evidence');
 assert.equal(posts,1,'Only the valid consented proof may be uploaded');
 const board=await client.read(track);assert.equal(scoreTicks(board.subarray(0,52)),scoreTicks(proof.record));
 await client.flush();
 for(const [key,bytes] of damaged)assert.deepEqual(saved.get(key)!.bytes,bytes);
 client.close();
});
test('restored private records use explicit engine identity without rewriting proofs',async()=>{
 const proof=await finishedScoreFixture(),encoder=new TextEncoder();
 const modern={...proof,physicsEngine:'ms-1991',record:[...proof.record]};modern.record[0]=77;
 const saved:NativeStoredFile[]=[{key:'VERIFIED:legacy',bytes:encoder.encode(JSON.stringify(proof))},{key:'VERIFIED:modern',bytes:encoder.encode(JSON.stringify(modern))}];
 const before=structuredClone(saved);let writes=0;
 const client=await createGlobalScoreClient({async all(){return saved;},async put(){writes++;}},async()=>{throw Error('Offline');});
 const track=Uint8Array.from(proof.replay.slice(24,0x722));
 assert.deepEqual(await client.retainedRecords(track),[proof.record]);
 assert.deepEqual(await client.retainedRecords(track,'ms-1991'),[modern.record]);
 assert.equal(writes,0);assert.deepEqual(saved,before);client.close();
});
test('identical controls queued under different engines remain separate offline',async()=>{
 const proof=await finishedScoreFixture(),saved=new Map<string,NativeStoredFile>();
 const persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const client=await createGlobalScoreClient(persistence,async()=>{throw Error('Offline');});
 await client.submit(proof);await client.submit({...proof,physicsEngine:'ms-1991'});
 const pending=[...saved.values()].filter(file=>file.key.startsWith('PENDING:')&&file.bytes.length);
 assert.equal(pending.length,2);assert.equal(pending.filter(file=>file.key.endsWith(':physics:ms-1991')).length,1);
 const track=Uint8Array.from(proof.replay.slice(24,0x722));
 assert.equal(scoreTicks((await client.read(track)).slice(0,52)),scoreTicks(proof.record));
 assert.equal(scoreTicks((await client.read(track,undefined,undefined,'ms-1991')).slice(0,52)),scoreTicks(proof.record));
 await client.flush();client.close();
});
test('submission owns the exact queued proof while persistence is pending',async()=>{
 const proof=await finishedScoreFixture(),before=structuredClone(proof),saved=new Map<string,NativeStoredFile>();
 let entered!:()=>void,release!:()=>void,posted:unknown;
 const writing=new Promise<void>(resolve=>{entered=resolve;}),gate=new Promise<void>(resolve=>{release=resolve;});
 const client=await createGlobalScoreClient({async all(){return [];},async put(file){saved.set(file.key,structuredClone(file));if(file.key.startsWith('PENDING:')&&file.bytes.length){entered();await gate;}}},async(_url,init)=>{
  posted=JSON.parse(String(init?.body));return Response.json({rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile([]))});
 });
 const pending=client.submit(proof);await writing;
 const queued=[...saved.values()].find(file=>file.key.startsWith('PENDING:'))!;
 assert.deepEqual(JSON.parse(new TextDecoder().decode(queued.bytes)).submission,before);
 proof.record[0]=90;proof.replay[0x722]^=1;proof.physicsEngine='ms-1991';release();await pending;
 assert.deepEqual(posted,{...before,publicReplayConsent:true},'Caller mutation must not replace the already queued and consented run');
 client.close();
});
test('background submission durably queues and returns while verification is still blocked',{timeout:5000},async()=>{
 const proof=await finishedScoreFixture(),saved=new Map<string,NativeStoredFile>();let release!:()=>void,posted=false;
 let markStarted!:()=>void;const started=new Promise<void>(resolve=>{markStarted=resolve;});
 const gate=new Promise<void>(resolve=>{release=resolve;});
 const persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const request:typeof fetch=async(_url,init)=>{if(init?.method==='POST'){posted=true;markStarted();await gate;}return Response.json({rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile([]))});};
 const client=await createGlobalScoreClient(persistence,request,()=>true);
 assert.equal(await client.submit(proof,true),'pending');
 assert.ok([...saved.values()].some(file=>file.key.startsWith('PENDING:')&&file.bytes.length));
 await started;assert.equal(posted,true,'Background validation eventually starts the upload without waiting for its response');
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
 await second.flush(); // Finish the offline background attempt before reconnecting.
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
