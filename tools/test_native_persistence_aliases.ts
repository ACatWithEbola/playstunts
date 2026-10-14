/** Actual persistence adapter with doubled IndexedDB request scheduling. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {openNativeFilePersistence,type NativeStoredFile} from '../lib/game/native-file-store.ts';
import {preparePrivateReplayUpload} from '../lib/game/replay-upload.ts';
const replay=new Uint8Array(readFileSync('public/game/replays/CTKFIN.RPL'));
const existing:NativeStoredFile={key:'C:\\copy.rpl',bytes:replay.slice(),physicsEngine:'ms-1991',framesPerSecond:10};
const rows=new Map<string,NativeStoredFile>([[existing.key,structuredClone(existing)]]);
let fullReads=0,keyReads=0;
const old=Object.getOwnPropertyDescriptor(globalThis,'indexedDB');
const database={close(){},transaction(){
 let pending=0,ended=false;const transaction:any={error:null};
 const request=(operation:()=>unknown)=>{
  pending++;const result:any={};queueMicrotask(()=>{try{result.result=operation();result.onsuccess?.();}catch(error){transaction.error=error;transaction.onabort?.();ended=true;}finally{pending--;if(!pending&&!ended)queueMicrotask(()=>{if(!pending&&!ended){ended=true;transaction.oncomplete?.();}});}});return result;
 };
 transaction.objectStore=()=>({getAllKeys:()=>{keyReads++;return request(()=>[...rows.keys()]);},getAll:()=>{fullReads++;return request(()=>structuredClone([...rows.values()]));},get:(key:string)=>request(()=>structuredClone(rows.get(key))),
  add(file:NativeStoredFile){const copy=structuredClone(file);return request(()=>{if(rows.has(copy.key))throw Error('Duplicate key');rows.set(copy.key,copy);return copy.key;});},
  put(file:NativeStoredFile){const copy=structuredClone(file);return request(()=>rows.set(copy.key,copy));}});
 return transaction;
}};
Object.defineProperty(globalThis,'indexedDB',{configurable:true,value:{open(){const request:any={result:database};queueMicrotask(()=>request.onsuccess?.());return request;}}});
try{
 const persistence=await openNativeFilePersistence('test-only-alias-fixture');
 const snapshot=structuredClone([...rows.values()]);
 const upload=preparePrivateReplayUpload('COPY.RPL',replay,'C:\\','ms-1990');
 assert.equal((await persistence.importReplay(upload)).status,'duplicate');
 assert.deepEqual([...rows.values()],snapshot,'Aliased replay import cannot rewrite bytes or recorded engine');
 const beforeFullReads=fullReads,beforeKeyReads=keyReads;
 assert.equal(await persistence.merge([{...upload,key:'C:\\COPY.RPL'}]),0);assert.deepEqual([...rows.values()],snapshot);
 assert.equal(fullReads,beforeFullReads,'Ordinary backup merge must not read retained replay blobs');assert.equal(keyReads,beforeKeyReads+1);
 const first={...upload,key:'C:\\NEW.RPL',bytes:replay.slice()},second={...upload,key:'C:\\new.rpl',physicsEngine:'ms-1991' as const};
 const merging=persistence.merge([first,second]);first.bytes[0]^=255;
 assert.equal(await merging,1);assert.deepEqual(rows.get('C:\\NEW.RPL')!.bytes,replay);assert.equal(rows.has(second.key),false);
 // Simulate another tab changing the plan's read set before its transaction.
 for(const change of ['bytes','engine','cadence','order','new-file'] as const){
  const expected=await persistence.all(),saved=structuredClone([...rows.entries()]);
  if(change==='new-file')rows.set('C:\\OTHER.TRK',{key:'C:\\OTHER.TRK',bytes:new Uint8Array([1])});
  else {const changed=structuredClone(rows.get(existing.key)!);if(change==='bytes')changed.bytes[0]^=1;if(change==='engine')changed.physicsEngine='ms-1990';if(change==='cadence')changed.framesPerSecond=20;if(change==='order')changed.order=99;rows.set(existing.key,changed);}
  const concurrent=structuredClone([...rows.values()]);
  await assert.rejects(persistence.merge([{...upload,key:'C:\\PLANNED.RPL'}],expected),/already exists/);
  assert.deepEqual([...rows.values()],concurrent,'Stale plan performs no partial additions or rewrites');
  rows.clear();for(const [key,file] of saved)rows.set(key,file);
 }
 const expected=await persistence.all();
 const guardedReads=fullReads;
 assert.equal(await persistence.merge([{...upload,key:'C:\\PLANNED.RPL'}],expected),1);
 assert.equal(fullReads,guardedReads+1,'Guarded merge validates retained bytes inside its transaction');
 const another=preparePrivateReplayUpload('FRESH.RPL',replay,'C:\\','ms-1990');
 const name=String.fromCharCode(...replay.slice(13,22)).split('\0')[0],trackKey='C:\\'+name.toLowerCase()+'.trk';
 const personal=replay.slice(24,0x722);personal[0]^=1;rows.set(trackKey,{key:trackKey,bytes:personal.slice()});
 assert.equal((await persistence.importReplay(another)).status,'conflict');assert.equal(rows.has(another.key),false);
 assert.deepEqual(rows.get(trackKey)!.bytes,personal);
 assert.equal((await persistence.importReplay(another,undefined,true)).status,'imported');assert.deepEqual(rows.get(trackKey)!.bytes,personal);
 const owned={...another,key:'C:\\OWNED.RPL',bytes:replay.slice(),physicsEngine:'ms-1991' as const,framesPerSecond:10 as const};
 const ownedBefore=structuredClone(owned),personalBefore=structuredClone(rows.get(trackKey));
 const importing=persistence.importReplay(owned,undefined,true);
 owned.bytes[0]^=255;owned.bytes[0x722]^=1;
 Object.assign(owned,{physicsEngine:'ms-1990',framesPerSecond:20});
 assert.equal((await importing).status,'imported');
 assert.deepEqual(rows.get(ownedBefore.key),ownedBefore,'Pending replay import owns its bytes, engine and cadence rather than caller references');
 assert.deepEqual(rows.get(trackKey),personalBefore,'Replay-only import leaves the conflicting personal track unchanged');
 persistence.close?.();console.log('IndexedDB adapter doubles verify case-alias replay/track protection, merge deduplication and caller-byte ownership; real browser transactions not certified');
}finally{if(old)Object.defineProperty(globalThis,'indexedDB',old);else delete (globalThis as any).indexedDB;}
