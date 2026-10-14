import assert from 'node:assert/strict';
import {createOriginalMusicRuntime,type OriginalMusicSeed} from '../lib/game/music-runtime.ts';
import {versionedAdlibRegisterWrites,initializeMs91AdlibRegisterCache} from '../lib/game/versioned-adlib-register-writes.ts';
const hardware=Array.from({length:10},()=>{const voice=Array(46).fill(0);voice[0]=255;return voice;});hardware[1][0]=0;
const voice=Uint8Array.from(hardware[1]);new DataView(voice.buffer).setUint32(16,0x90000001,true);hardware[1]=Array.from(voice);
const seed:OriginalMusicSeed={header:0,bank:Array(32).fill(0),voices:Array(101).fill(0),timers:Array.from({length:24},()=>Array(72).fill(0)),hardware,lastNotes:Array(24).fill(0),velocities:Array(9).fill(127),initialWrites:[],percussion:[]};
const driver=new Uint8Array(3571);initializeMs91AdlibRegisterCache(driver);const original=driver.slice(),expectedDriver=driver.slice();
const legacy=createOriginalMusicRuntime(seed),modern=createOriginalMusicRuntime(seed,{driverGeneration:'ms-1991',driver});
for(const value of [100,100,0,0,127]){
 const old=legacy.control({type:'volume',owner:0,value});const actual=modern.control({type:'volume',owner:0,value});
 assert.deepEqual(actual,versionedAdlibRegisterWrites(expectedDriver,old,'ms-1991'));
}
assert.deepEqual(driver,original,'Runtime cache is owned copy, not source mutation');
assert.throws(()=>createOriginalMusicRuntime(seed,{driverGeneration:'ms-1991',driver:new Uint8Array(1)}));
assert.deepEqual(modern.tick(false),[]);
console.log('AdLib music control/tick uses retained modern cache; repeated volume writes suppress correctly, source seed/driver and legacy behavior preserved');
