import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createControlledOriginalMusic} from '../lib/game/controlled-music-runtime.ts';
import {initializeMs91AdlibRegisterCache,versionedAdlibRegisterWrites} from '../lib/game/versioned-adlib-register-writes.ts';
for(const score of ['titl','slct','over','vict']){
 const source=readFileSync(`public/game/music-${score}-seed.json`),seed=JSON.parse(source.toString()),driver=new Uint8Array(3571);
 initializeMs91AdlibRegisterCache(driver);versionedAdlibRegisterWrites(driver,seed.initialWrites,'ms-1991');const expected=driver.slice();
 const legacy=createControlledOriginalMusic(seed),modern=createControlledOriginalMusic(seed,{driverGeneration:'ms-1991',driver});
 for(let tick=0;tick<5000;tick++){
  assert.deepEqual(modern.tick(),versionedAdlibRegisterWrites(expected,legacy.tick(),'ms-1991'),score+' tick'+tick);
  if(tick===100||tick===200){const operation=tick===100?'pause-audio':'resume-audio';assert.deepEqual(modern.control(operation).writes,versionedAdlibRegisterWrites(expected,legacy.control(operation).writes,'ms-1991'));}
 }
 assert.deepEqual(modern.runtime.timers,legacy.runtime.timers);assert.deepEqual(modern.runtime.voices,legacy.runtime.voices);assert.deepEqual(readFileSync(`public/game/music-${score}-seed.json`),source);
}
console.log('Four bundled AdLib scores/20000 ticks match legacy sequencing with exact modern cache filtering, pause/resume and unchanged source assets');
