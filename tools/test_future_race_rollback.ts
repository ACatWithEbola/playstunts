import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectFutureRaceEngine,DEFAULT_FUTURE_RACE_ENGINE} from '../lib/game/future-race-engine.ts';
import {resolvePhysicsEngine} from '../lib/physics/engine-version.ts';
import {selectBrowserFutureRaceEngine} from '../lib/game/browser-future-race-engine.ts';
import {createNativeFileStore,type NativeStoredFile} from '../lib/game/native-file-store.ts';
import {readFileSync} from 'node:fs';
import {versionedDemoResource} from '../lib/game/versioned-demo-resource.ts';
import {nativeFileDownload} from '../lib/game/native-file-download.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import ts from 'typescript';
test('candidate default flip changes fresh browser launches but never missing recorded identity',()=>{
 const futureSource=readFileSync(new URL('../lib/game/future-race-engine.ts',import.meta.url),'utf8');
 const browserSource=readFileSync(new URL('../lib/game/browser-future-race-engine.ts',import.meta.url),'utf8');
 const declaration='DEFAULT_FUTURE_RACE_ENGINE:PhysicsEngineVersion=MS91_PHYSICS';
 assert.equal(futureSource.split(declaration).length,2,'Audit the actual release declaration before simulating a flip');
 const load=(source:string,bindings:Record<string,unknown>)=>{
  const withoutImports=source.replace(/^import .*;\s*$/gm,'');
  const code=ts.transpileModule(withoutImports,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const exports:Record<string,any>={};
  new Function('exports',...Object.keys(bindings),code)(exports,...Object.values(bindings));
  return exports;
 };
 for(const target of ['LEGACY_PHYSICS','MS91_PHYSICS']){
  const future=load(futureSource.replace(declaration,'DEFAULT_FUTURE_RACE_ENGINE:PhysicsEngineVersion='+target),{LEGACY_PHYSICS:'ms-1990',MS91_PHYSICS:'ms-1991',resolvePhysicsEngine});
  const browser=load(browserSource,{selectFutureRaceEngine:future.selectFutureRaceEngine});
  for(const hostname of ['localhost','playstunts.com']){
   assert.equal(browser.selectBrowserFutureRaceEngine({hostname,search:''}),target==='MS91_PHYSICS'?'ms-1991':'ms-1990');
   for(const recorded of [undefined,'ms-1990','ms-1991']){
    assert.equal(resolvePhysicsEngine(recorded),recorded??'ms-1990');
    for(const chosen of ['ms-1990','ms-1991'])assert.equal(browser.selectBrowserFutureRaceEngine({hostname,search:'?play-engine='+chosen}),chosen);
   }
  }
 }
});
test('rollback selections and store reopen preserve mixed recorded engines, cadence and score bytes',async()=>{
 const legacyBytes=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url)));
 const slow=versionedDemoResource('ms-1991')!;
 const records:NativeStoredFile[]=[
  {key:'C:\\OLD.RPL',bytes:legacyBytes,order:1},
  // Canonical storage layouts can match across engines; this verifies byte
  // ownership/routing, not a claim that these inputs finish in modern physics.
  {key:'C:\\NEW.RPL',bytes:legacyBytes.slice(),order:2,physicsEngine:'ms-1991',framesPerSecond:20},
  {key:'C:\\SLOW.RPL',bytes:slow.bytes.slice(),order:3,physicsEngine:'ms-1991',framesPerSecond:slow.framesPerSecond},
  {key:'C:\\DEFAULT.HIG',bytes:Uint8Array.from({length:364},(_,i)=>i&255),order:4},
  {key:'C:\\MODERN.HIG',bytes:Uint8Array.from({length:364},(_,i)=>(255-i)&255),order:5,physicsEngine:'ms-1991',framesPerSecond:20},
 ];
 const original=structuredClone(records),writes:NativeStoredFile[]=[];
 const originalDownloads=original.map(file=>nativeFileDownload(file));
 const persistence={async all(){return structuredClone(records);},async put(file:NativeStoredFile){writes.push(structuredClone(file));}};
 for(const engine of ['ms-1991','ms-1990','ms-1991','ms-1990']){
  assert.equal(selectFutureRaceEngine(engine),engine);
  const store=await createNativeFileStore(new Map(),persistence);
  for(const [index,record] of original.entries()){
   const [name,extension]=record.key.slice(3).split('.');
   const bytes=await store.read('',name,'.'+extension);
   assert.deepEqual(bytes,record.bytes);
   const physicsEngine=store.physicsEngine('',name,'.'+extension),framesPerSecond=store.framesPerSecond('',name,'.'+extension);
   const download=nativeFileDownload({...record,bytes,physicsEngine,framesPerSecond});
   assert.deepEqual(download,originalDownloads[index],'Changing the future race engine must not change exported replay/score files');
   if(extension==='RPL'&&physicsEngine!=='ms-1990'){
    const decoded=decodeVersionedReplay(download,physicsEngine);
    assert.equal(decoded.framesPerSecond,record.framesPerSecond??20);
    assert.deepEqual(decoded.bytes,record.bytes,'Rollback exports must retain the complete original control stream and track');
   }
   bytes.fill(255); // Returned copies must not corrupt the next reopen.
   assert.equal(store.physicsEngine('',name,'.'+extension),record.physicsEngine??'ms-1990');
   assert.equal(store.framesPerSecond('',name,'.'+extension),record.framesPerSecond??20);
  }
  store.close();
 }
 assert.deepEqual(records,original);assert.deepEqual(writes,[],'Selecting a future engine must not write existing private files');
});
test('explicit launch choice selects fresh engine without changing recorded identities',()=>{
 for(const hostname of ['localhost','playstunts.com'])for(const engine of ['ms-1990','ms-1991']){
  assert.equal(selectBrowserFutureRaceEngine({hostname,search:'?preview-engine=ms-1991&play-engine='+engine}),engine);
 }
 assert.throws(()=>selectBrowserFutureRaceEngine({hostname:'playstunts.com',search:'?play-engine=bb-1991'}));
 assert.throws(()=>selectBrowserFutureRaceEngine({hostname:'localhost',search:'?play-engine=unknown'}));
 assert.equal(resolvePhysicsEngine(undefined),'ms-1990');
 assert.equal(resolvePhysicsEngine('ms-1991'),'ms-1991');
});
test('preview override applies only to fresh races on loopback hosts',()=>{
 for(const hostname of ['localhost','127.0.0.1','[::1]','::1'])assert.equal(selectBrowserFutureRaceEngine({hostname,search:'?preview-engine=ms-1991'}),'ms-1991');
 for(const hostname of ['playstunts.com','stunts-rebuilt.lokaas.chatgpt.site','localhost.example.com']){
  assert.equal(selectBrowserFutureRaceEngine({hostname,search:'?preview-engine=ms-1991'}),DEFAULT_FUTURE_RACE_ENGINE);
  assert.equal(selectBrowserFutureRaceEngine({hostname,search:'?preview-engine=unknown'}),DEFAULT_FUTURE_RACE_ENGINE);
 }
 assert.equal(selectBrowserFutureRaceEngine(undefined),DEFAULT_FUTURE_RACE_ENGINE);
 for(const hostname of ['localhost','playstunts.com']){
  for(const search of ['', '?unrelated=kept'])assert.equal(selectBrowserFutureRaceEngine({hostname,search}),DEFAULT_FUTURE_RACE_ENGINE,'Clean launch verifies release default without deleting stored recordings');
 }
 assert.throws(()=>selectBrowserFutureRaceEngine({hostname:'localhost',search:'?preview-engine=bb-1991'}));
});
test('future-race rollback changes no recording identity or bytes',()=>{
 const legacy={bytes:new Uint8Array([1,2,3]),physicsEngine:undefined};
 const modern={bytes:new Uint8Array([4,5,6]),physicsEngine:'ms-1991'};
 const snapshot=structuredClone([legacy,modern]);
 assert.equal(DEFAULT_FUTURE_RACE_ENGINE,'ms-1991','approved release selects MS91 for new races only');
 for(const selection of ['ms-1991','ms-1990','ms-1991','ms-1990']){
  assert.equal(selectFutureRaceEngine(selection),selection);
  assert.equal(resolvePhysicsEngine(legacy.physicsEngine),'ms-1990');
  assert.equal(resolvePhysicsEngine(modern.physicsEngine),'ms-1991');
  assert.deepEqual([legacy,modern],snapshot);
 }
 assert.throws(()=>selectFutureRaceEngine('bb-1991'));
 assert.throws(()=>selectFutureRaceEngine('latest'));
});
