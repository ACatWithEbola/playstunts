import assert from 'node:assert/strict';
import {originalTandyVolumeGateWrites} from '../lib/game/tandy-control.ts';
import {readFileSync} from 'node:fs';
import {createOriginalTandyMusicRuntime} from '../lib/game/tandy-music-runtime.ts';
import {applyOriginalTandyTrackControl} from '../lib/game/tandy-track-control.ts';
import {setOriginalTandyEffectsEnabled} from '../lib/game/tandy-effect-mute.ts';
let cases=0;
for(let channel=0;channel<6;channel++)for(let volume=0;volume<256;volume++)for(let port=0;port<256;port++){
 const expected=channel===5&&volume<8?[[0x61,port&252]]:[];
 assert.deepEqual(originalTandyVolumeGateWrites(channel,volume,port,'ms-1991'),expected);
 assert.deepEqual(originalTandyVolumeGateWrites(channel,volume,port,'ms-1990'),[]);
 assert.deepEqual(originalTandyVolumeGateWrites(channel,volume,port),[]);cases++;
}
console.log(`${cases} volume/channel/port cases match the audited modern zero-volume gate predicate; legacy emits no additional writes`);
for(const generation of ['ms-1990','ms-1991'] as const){
 const seed=JSON.parse(readFileSync('public/game/tandy-music-slct-seed.json','utf8'));
 seed.port61=255;seed.hardware[5][0]=0;
 const runtime=createOriginalTandyMusicRuntime(seed,generation);
 const result=runtime.control({type:'volume',owner:0,value:7},0);
 assert.deepEqual(result.writes,generation==='ms-1991'?[[0x61,252]]:[]);
 assert.equal(runtime.port61,generation==='ms-1991'?252:255);
 const controlled=applyOriginalTandyTrackControl(runtime.driver,runtime.timers,runtime.voices,0,7,0,generation,255);
 assert.deepEqual(controlled.writes,generation==='ms-1991'?[[0x61,252]]:[]);
 if(generation==='ms-1991')assert.throws(()=>applyOriginalTandyTrackControl(runtime.driver,runtime.timers,runtime.voices,0,7,0,generation),/current port61/);
 runtime.voices[5][0]=16;
 const before={timers:runtime.timers,voices:runtime.voices,lastNotes:runtime.lastNotes,driver:runtime.driver,driverGeneration:generation,enabled:1,savedVolumes:new Uint8Array(24)};
 const muted=setOriginalTandyEffectsEnabled(before,false,255);
 assert.deepEqual(muted.writes,generation==='ms-1991'?[[0x61,252]]:[]);
 assert.deepEqual(muted.voices,before.voices,'Mute must not change voice ownership');
 if(generation==='ms-1991')assert.throws(()=>setOriginalTandyEffectsEnabled(before,false),/current port61/);
}
console.log('Owned channel5 music volume/controller routes deliver immediate modern gate, retain port state and reject missing host context; legacy unchanged');
