import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createControlledOriginalMusic} from '../lib/game/controlled-music-runtime.ts';
import {versionedAdlibRegisterWrites,initializeMs91AdlibRegisterCache} from '../lib/game/versioned-adlib-register-writes.ts';
let driver=new Uint8Array(3571);initializeMs91AdlibRegisterCache(driver);const expected=driver.slice();
for(const name of ['titl','slct','over','vict','titl']){
 const seed=JSON.parse(readFileSync(`public/game/music-${name}-seed.json`,'utf8'));
 assert.deepEqual(versionedAdlibRegisterWrites(driver,seed.initialWrites,'ms-1991'),versionedAdlibRegisterWrites(expected,seed.initialWrites,'ms-1991'));
 const modern=createControlledOriginalMusic(seed,{driverGeneration:'ms-1991',driver}),legacy=createControlledOriginalMusic(seed);
 for(let tick=0;tick<500;tick++)assert.deepEqual(modern.tick(),versionedAdlibRegisterWrites(expected,legacy.tick(),'ms-1991'));
 driver=modern.runtime.driverSnapshot()!;assert.deepEqual(driver,expected);
}
console.log('Five music score switches retain actual prior cache and match2500 filtered ticks; snapshot ownership independent');
