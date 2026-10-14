import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname} from 'node:path';
import {runInThisContext} from 'node:vm';
import {createControlledOriginalMusic} from '../lib/game/controlled-music-runtime.ts';
import {createOplOutput} from '../lib/game/opl-output.ts';
import {createAudioRuntimeStream} from '../lib/game/player-audio-stream.ts';
import {versionedAd15Resource} from '../lib/game/versioned-ad15-resource.ts';
import {initializeMs91AdlibRegisterCache,versionedAdlibRegisterWrites} from '../lib/game/versioned-adlib-register-writes.ts';
// Load the exact bundled CommonJS-compatible library without editing its file
// or treating its browser .js suffix as an ES module. No hardware output.
const path=resolve('public/audio/opl.js'),module={exports:{} as any};
runInThisContext('(function(module,exports,require,__dirname){'+readFileSync(path,'utf8')+'\n})',{filename:path})(module,module.exports,createRequire(path),dirname(path));
// Emscripten's module is itself thenable. Resolve a plain holder, not the module,
// otherwise native Promise assimilation can recurse without reaching the test.
const opl=await new Promise<any>((resolve,reject)=>module.exports({wasmBinary:readFileSync('public/audio/opl.wasm'),onAbort:reject}).then((m:any)=>resolve({OPL:m.OPL})));
let comparisons=0,nonzero=0;const retained=versionedAd15Resource('ms-1991')!;
const oldChip=new opl.OPL(96000,2,2048),newChip=new opl.OPL(96000,2,2048);
try{
 const oldOutput=createOplOutput(oldChip),newOutput=createOplOutput(newChip);
 for(const [reg,value] of initializeMs91AdlibRegisterCache(retained))newOutput.write(reg,value);
 for(const name of ['titl','slct','over','vict'] as const){
  const seed=JSON.parse(readFileSync(`public/game/music-${name}-seed.json`,'utf8'));
  const initial=versionedAdlibRegisterWrites(retained,seed.initialWrites,'ms-1991');
  const oldRuntime=createControlledOriginalMusic(seed),newRuntime=createControlledOriginalMusic(seed,{driverGeneration:'ms-1991',driver:retained});
  const oldStream=createAudioRuntimeStream({initialWrites:seed.initialWrites,tick:()=>oldRuntime.tick()},oldOutput,48000);
  const newStream=createAudioRuntimeStream({initialWrites:initial,tick:()=>newRuntime.tick()},newOutput,48000);
  let scoreNonzero=0;
  for(let block=0;block<600;block++){
   const expected=oldStream.render(512),actual=newStream.render(512);
   assert.deepEqual(actual,expected,`${name} PCM block ${block}`);comparisons+=actual.length;
   for(const sample of actual)if(sample!==0){nonzero++;scoreNonzero++;}
  }
  assert.ok(scoreNonzero>0,`${name} produces nonzero PCM`);
  retained.set(newRuntime.runtime.driverSnapshot()!);
 }
 console.log(`Real bundled OPL/WASM: four scores, ${comparisons} stereo sample comparisons equal across driver generations; ${nonzero} nonzero samples; no hardware playback`);
}finally{oldChip.delete();newChip.delete();}
