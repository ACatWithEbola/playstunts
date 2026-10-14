import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createNativeFileStore,type NativeStoredFile} from '../lib/game/native-file-store.ts';
test('engine metadata survives reopen without rewriting untagged old files',async()=>{
 const old:NativeStoredFile={key:'C:\\OLD.RPL',bytes:new Uint8Array([1,2,3]),order:1};
 const persisted=new Map([[old.key,structuredClone(old)]]),writes:string[]=[];
 const persistence={async all(){return [...persisted.values()].map(f=>structuredClone(f));},async put(file:NativeStoredFile){writes.push(file.key);persisted.set(file.key,structuredClone(file));}};
 const store=await createNativeFileStore(new Map(),persistence);
 assert.equal(store.physicsEngine('','OLD','.rpl'),'ms-1990');assert.deepEqual(writes,[]);
 await store.write('','NEW','.rpl',new Uint8Array([4,5,6]),'bb-1991');
 await store.write('','MIND','.rpl',new Uint8Array([7,8,9]),'ms-1991');
 const reopened=await createNativeFileStore(new Map(),persistence);
 assert.equal(reopened.physicsEngine('','NEW','.rpl'),'bb-1991');
 assert.equal(reopened.physicsEngine('','MIND','.rpl'),'ms-1991');
 assert.equal(reopened.physicsEngine('','OLD','.rpl'),'ms-1990');
 assert.deepEqual(persisted.get(old.key),old);assert.deepEqual(writes,['C:\\NEW.RPL','C:\\MIND.RPL']);
});
test('DOS-case aliases reopen with recorded metadata without rewriting stored keys',async()=>{
 const file:NativeStoredFile={key:'C:\\\\saved\\slow.rpl',bytes:new Uint8Array([7,8,9]),physicsEngine:'ms-1991',framesPerSecond:10,order:2};
 const persisted=new Map([[file.key,structuredClone(file)]]),writes:NativeStoredFile[]=[];
 const persistence={async all(){return [...persisted.values()].map(f=>structuredClone(f));},async put(next:NativeStoredFile){writes.push(structuredClone(next));persisted.set(next.key,structuredClone(next));}};
 const store=await createNativeFileStore(new Map(),persistence);
 assert.deepEqual(await store.read('C:\\SAVED\\','SLOW','.RPL'),file.bytes);
 assert.equal(store.physicsEngine('C:\\SAVED\\','SLOW','.RPL'),'ms-1991');
 assert.equal(store.framesPerSecond('C:\\SAVED\\','SLOW','.RPL'),10);
 assert.deepEqual(store.enumerate('C:\\SAVED\\','.RPL'),['SLOW.RPL']);
 assert.equal(writes.length,0);assert.deepEqual(persisted.get(file.key),file);
 await store.write('C:\\SAVED\\','SLOW','.RPL',new Uint8Array([1,2,3]),'ms-1991',10);
 assert.equal(persisted.size,1,'An ordinary save must not create a second DOS alias');
 assert.equal(writes[0].key,file.key,'Keep the original persistence key on explicit save');
});
test('ambiguous retained DOS aliases fail without deleting either recording',async()=>{
 const files:NativeStoredFile[]=[{key:'C:\\SAME.RPL',bytes:new Uint8Array([1])},{key:'C:\\same.rpl',bytes:new Uint8Array([2]),physicsEngine:'ms-1991'}],before=structuredClone(files);
 await assert.rejects(createNativeFileStore(new Map(),{async all(){return structuredClone(files);},async put(){assert.fail('No repair writes permitted');}}),/Ambiguous stored DOS filename/);
 assert.deepEqual(files,before);
});
