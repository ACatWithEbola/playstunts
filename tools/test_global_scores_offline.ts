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
