import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveReplayCadence} from '../lib/game/replay-cadence.ts';
import {createNativeFileStore,type NativeStoredFile} from '../lib/game/native-file-store.ts';
import {createGlobalScoreFileStore} from '../lib/game/global-score-file-store.ts';
import {createGlobalScoreClient} from '../lib/game/browser-global-scores.ts';
test('old cadence defaults without writes; explicit cadence survives loading',async()=>{
 const files=[{key:'C:\\OLD.RPL',bytes:new Uint8Array([1])},{key:'C:\\SLOW.RPL',bytes:new Uint8Array([2]),framesPerSecond:10 as const}];
 const before=structuredClone(files);
 const store=await createNativeFileStore(new Map(),{async all(){return files;},async put(){throw Error('Unexpected write');}});
 assert.equal(store.framesPerSecond('','OLD','.rpl'),20);
 assert.equal(store.framesPerSecond('','SLOW','.rpl'),10);
 assert.deepEqual(files,before);
});
test('score wrapper forwards replay cadence without invoking leaderboard services',async()=>{
 const saved=new Map<string,NativeStoredFile>();
 const persistence={async all(){return [...saved.values()];},async put(file:NativeStoredFile){saved.set(file.key,structuredClone(file));}};
 const local=await createNativeFileStore(new Map(),persistence);
 const client=await createGlobalScoreClient({async all(){return [];},async put(){throw Error('Unexpected score write');}},async()=>{throw Error('Unexpected leaderboard request');});
 const files=createGlobalScoreFileStore(local,client,()=>undefined);
 await files.write('','SLOW','.rpl',new Uint8Array([3,4]),'ms-1991',10);
 assert.equal(files.framesPerSecond('','SLOW','.rpl'),10);
 assert.equal(files.physicsEngine('','SLOW','.rpl'),'ms-1991');
 assert.deepEqual(await files.read('','SLOW','.rpl'),new Uint8Array([3,4]));
 assert.deepEqual([...saved.keys()],['C:\\SLOW.RPL']);
 files.close();
});
test('unknown cadence fails closed',()=>{
 for(const value of [0,30,null,'20'])assert.throws(()=>resolveReplayCadence(value));
 assert.equal(resolveReplayCadence(undefined),20);
});
test('writing and replacing a recording updates cadence without stale metadata',async()=>{
 const files=new Map<string,NativeStoredFile>();
 const persistence={async all(){return [...files.values()];},async put(file:NativeStoredFile){files.set(file.key,structuredClone(file));}};
 const store=await createNativeFileStore(new Map(),persistence);
 await store.write('','NEW','.rpl',new Uint8Array([1]),'ms-1991',10);
 assert.equal(store.framesPerSecond('','NEW','.rpl'),10);
 assert.equal((await createNativeFileStore(new Map(),persistence)).framesPerSecond('','NEW','.rpl'),10);
 await store.write('','NEW','.rpl',new Uint8Array([2]),'ms-1991');
 assert.equal(store.framesPerSecond('','NEW','.rpl'),20);
 assert.equal('framesPerSecond' in files.get('C:\\NEW.RPL')!,false);
});
