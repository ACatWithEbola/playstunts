import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGlobalScoreClient} from '../lib/game/browser-global-scores.ts';
import {sharedScoreFile,GLOBAL_SCORE_RULES,scoreTicks} from '../lib/game/global-score-format.ts';
import {finishedScoreFixture} from './global-score-fixture.ts';
import type {NativeStoredFile} from '../lib/game/native-file-store.ts';
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
test('automatic replay sharing is off by default and only publishes ranked verified submissions after opt-in',async()=>{
 const proof=await finishedScoreFixture(),id='c'.repeat(64),saved=new Map<string,NativeStoredFile>();let sharing=0,ranked=true;
 const persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const request:typeof fetch=async(url,init)=>{if(String(url)==='/api/replays'){sharing++;assert.equal((init?.headers as Record<string,string>)['X-Stunts-Replay'],'share');assert.deepEqual(JSON.parse(String(init?.body)),proof);return Response.json({shared:true,id});}return Response.json({id,ranked,rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile([]))});};
 const privateClient=await createGlobalScoreClient(persistence,request);await privateClient.submit(proof);assert.equal(sharing,0,'Default preference must not publish');
 const enabled=await createGlobalScoreClient(persistence,request,()=>true);await enabled.flush();assert.equal(sharing,0,'Enabling must not retroactively share private VERIFIED records');await enabled.submit(proof);assert.equal(sharing,1);await enabled.submit(proof);assert.equal(sharing,1,'Retries must not repeatedly publish the same recording');
 ranked=false;await enabled.submit(proof);assert.equal(sharing,1);await assert.rejects(enabled.submit({...proof,continued:true}));assert.equal(sharing,1);
});
test('queued automatic sharing is cancelled when the player disables the preference',async()=>{
 const proof=await finishedScoreFixture(),id='d'.repeat(64),saved=new Map<string,NativeStoredFile>();let sharing=0;
 const persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,file);}};
 const request:typeof fetch=async(url)=>{if(String(url)==='/api/replays'){sharing++;return new Response('Unavailable',{status:503});}return Response.json({id,ranked:true,rules:GLOBAL_SCORE_RULES,file:Array.from(sharedScoreFile([]))});};
 const first=await createGlobalScoreClient(persistence,request,()=>true);assert.equal(await first.submit(proof),'accepted');assert.equal(sharing,1);first.close();
 const disabled=await createGlobalScoreClient(persistence,request,()=>false);await disabled.flush();assert.equal(sharing,1);assert.equal(saved.get('SHARE_PENDING:'+id)!.bytes.length,0);assert.ok(saved.get('VERIFIED:'+id)!.bytes.length);
});
