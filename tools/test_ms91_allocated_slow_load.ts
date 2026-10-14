import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {loadAllocatedReplay} from '../lib/game/allocated-replay-load.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readRecordedTwoCarRace} from '../lib/game/recorded-two-car-race.ts';
import {hasReplayCheckpointCapacity} from '../lib/game/replay-checkpoint-capacity.ts';
import {createNativeReplayRaceSession} from '../lib/game/native-manual-race-session.ts';
const [path,fastPath]=process.argv.slice(2);if(!path||!fastPath)throw Error('Provide original MS91 10 Hz DEFAULT.RPL AND a modern20 Hz replay reference');
const original=readFileSync(path),decoded=decodeVersionedReplay(original,'ms-1991');assert.equal(decoded.framesPerSecond,10);
const bytes=decoded.bytes,data={...fixtureData,physicsEngine:'ms-1991' as const,framesPerSecond:10 as const,experimental10Hz:true};
const menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'SLOWLOAD',camera:0,graphics:2,soundEnabled:false};
const runtime=await createNativeManualRaceRuntime(data,menu,{resetMouse(){}});runtime.session.skipIntroduction();
let reads=0;
const loaded=await loadAllocatedReplay(data,runtime,{async selectReplay(){return 1;},async readReplay(){reads++;return bytes.slice();},replayPhysicsEngine(){return 'ms-1991';},replayFramesPerSecond(){return 10;},showWaiting(){},progress(){},writeAudio(){}});
assert.ok(loaded);assert.equal(reads,1);assert.equal(loaded.session.framesPerSecond,10);assert.equal(loaded.session.physicsEngine,'ms-1991');assert.equal(loaded.session.length,958);
const baseline=loaded.session.state.memory.slice();
for(const target of [0,1,100,600,958]){
 loaded.session.seek(0);loaded.session.seek(target);const expected:ReturnType<typeof readRecordedTwoCarRace>['player']['driving']['car']=readRecordedTwoCarRace(loaded.session.state.memory.slice(),0x2d1a0).player.driving.car;
 loaded.session.originalMemory.writeMemory(baseline.slice());loaded.session.initializeLoadedReplay();
 loaded.session.state.memory[0x2d1a0+0x9aca]=1;loaded.session.state.memory[0x2d1a0+0xa3c2]=2;
 for(let frame=0;frame<target;frame++){captureOriginalRaceInput(loaded.session.state.memory,0x2d1a0,bytes[0x722+frame],10);loaded.session.originalMemory.writeMemory(loaded.session.state.memory);let steps=0;loaded.session.advanceCaptured({entryStackPointer:0xfefc,incomingSI:target-frame},()=>assert.ok(++steps<=2));}
 const actual:ReturnType<typeof readRecordedTwoCarRace>['player']['driving']['car']=readRecordedTwoCarRace(loaded.session.state.memory.slice(),0x2d1a0).player.driving.car;
 if(target===0){delete actual.wheelPositions;delete expected.wheelPositions;}
 assert.deepEqual(actual,expected,'Loaded10 Hz seek matches independent replay stepping at '+target);
 assert.equal(loaded.session.state.memory[0x2d1a0+0x8018]&1,0);
}
assert.equal(loaded.session.state.player.driving.car.grip.crash,3);assert.deepEqual(readFileSync(path),original);
console.log('Test-only allocated MS91 10 Hz reload/rewind reaches original finish with unchanged source and no fresh-score eligibility');
const fastOriginal=readFileSync(fastPath),fast=decodeVersionedReplay(fastOriginal,'ms-1991');assert.equal(fast.framesPerSecond,20);
const fastLoaded=await loadAllocatedReplay(data,loaded,{async selectReplay(){return 1;},async readReplay(){return fast.bytes.slice();},replayPhysicsEngine(){return 'ms-1991';},replayFramesPerSecond(){return 20;},showWaiting(){},progress(){},writeAudio(){}});
assert.ok(fastLoaded);assert.equal(fastLoaded.session.framesPerSecond,20);assert.equal(fastLoaded.session.length,fast.bytes.length-0x722);
for(const frame of [0,100,fastLoaded.session.length]){fastLoaded.session.seek(0);fastLoaded.session.seek(frame);assert.equal(fastLoaded.session.state.player.driving.race.stats[2],frame);}
assert.equal(fastLoaded.session.state.player.driving.car.grip.crash,3);assert.equal(fastLoaded.session.state.memory[0x2d1a0+0x8018]&1,0);
let slowReads=0;
assert.ok(hasReplayCheckpointCapacity(fastLoaded.session.state.memory,0x2d1a0,10));
const slowAgain=await loadAllocatedReplay(data,fastLoaded,{async selectReplay(){return 1;},async readReplay(){return bytes.slice();},replayPhysicsEngine(){return 'ms-1991';},replayFramesPerSecond(){return 10;},showWaiting(){},progress(){},writeAudio(){}});
assert.ok(slowAgain);assert.equal(slowAgain.session.framesPerSecond,10);slowAgain.session.seek(958);assert.equal(slowAgain.session.state.player.driving.car.grip.crash,3);
const small=await createNativeManualRaceRuntime({...data,framesPerSecond:20},{...menu,configuration:Array.from(fast.bytes.slice(0,24)),track:Array.from(fast.bytes.slice(24,0x722))},{resetMouse(){}});
small.session.skipIntroduction();assert.equal(hasReplayCheckpointCapacity(small.session.state.memory,0x2d1a0,10),false);
const smallBefore=small.session.state.memory.slice();
await assert.rejects(()=>loadAllocatedReplay(data,small,{async selectReplay(){return 1;},async readReplay(){throw Error('Injected missing slow file');},replayPhysicsEngine(){return 'ms-1991';},replayFramesPerSecond(){return 10;},showWaiting(){},progress(){},writeAudio(){}}),/Injected missing slow file/);
assert.deepEqual(small.session.state.memory,smallBefore,'Failed growth/load restores the complete prior session memory');
const failingData={...data,vectors:new Proxy(data.vectors,{get(){throw Error('Injected post-commit route analysis failure');}})};
await assert.rejects(()=>loadAllocatedReplay(failingData,small,{async selectReplay(){return 1;},async readReplay(){return bytes.slice();},replayPhysicsEngine(){return 'ms-1991';},replayFramesPerSecond(){return 10;},showWaiting(){},progress(){},writeAudio(){}}),/Injected post-commit route analysis failure/);
assert.deepEqual(small.session.state.memory,smallBefore,'Failure after replacement commit restores the complete prior allocation graph');
const grownSlow=await loadAllocatedReplay(data,small,{async selectReplay(){return 1;},async readReplay(){slowReads++;return bytes.slice();},replayPhysicsEngine(){return 'ms-1991';},replayFramesPerSecond(){return 10;},showWaiting(){},progress(){},writeAudio(){}});
assert.ok(grownSlow);assert.equal(slowReads,1);assert.equal(grownSlow.session.framesPerSecond,10);assert.ok(hasReplayCheckpointCapacity(grownSlow.session.state.memory,0x2d1a0,10));
grownSlow.session.seek(958);assert.equal(grownSlow.session.state.player.driving.car.grip.crash,3);assert.equal(grownSlow.session.state.memory[0x2d1a0+0x8018]&1,0);
assert.deepEqual(readFileSync(fastPath),fastOriginal);assert.deepEqual(readFileSync(path),original);
console.log('10→20→10 and small-bank20→10 reach finishes; failed growth/load restores prior memory; sources unchanged');
const legacyBytes=readFileSync('public/game/replays/CTKFIN.RPL'),legacyBefore=legacyBytes.slice();
const legacyRuntime=await createNativeManualRaceRuntime({...data,physicsEngine:'ms-1990',framesPerSecond:20},{...menu,configuration:Array.from(legacyBytes.slice(0,24)),track:Array.from(legacyBytes.slice(24,0x722))},{resetMouse(){}});
legacyRuntime.session.skipIntroduction();
assert.equal(hasReplayCheckpointCapacity(legacyRuntime.session.state.memory,0x2d1a0,10),false);
const fromLegacy=await loadAllocatedReplay(data,legacyRuntime,{async selectReplay(){return 1;},async readReplay(){return bytes.slice();},replayPhysicsEngine(){return 'ms-1991';},replayFramesPerSecond(){return 10;},showWaiting(){},progress(){},writeAudio(){}});
assert.ok(fromLegacy);assert.equal(fromLegacy.session.physicsEngine,'ms-1991');assert.equal(fromLegacy.session.framesPerSecond,10);
const freshSlow=await createNativeReplayRaceSession(data,menu,{bytes,name:'SLOW',path:'C:\\',physicsEngine:'ms-1991',framesPerSecond:10},{resetMouse(){},async key(){return 27;}});
if(process.env.SLOW_LOAD_DIAGNOSTICS==='1')for(const frame of [0,1,20,100,958]){
 for(const next of [fromLegacy,freshSlow]){next.session.seek(0);next.session.seek(frame);}
 const a=readRecordedTwoCarRace(fromLegacy.session.state.memory,0x2d1a0).player.driving.car,b=readRecordedTwoCarRace(freshSlow.session.state.memory,0x2d1a0).player.driving.car;
 console.log(JSON.stringify({frame,differences:Object.keys(a).filter(key=>JSON.stringify(a[key as keyof typeof a])!==JSON.stringify(b[key as keyof typeof b])).map(key=>({key,actual:a[key as keyof typeof a],expected:b[key as keyof typeof b]}))}));
}
fromLegacy.session.seek(0);fromLegacy.session.seek(958);assert.equal(fromLegacy.session.state.player.driving.car.grip.crash,3);
const backToLegacy=await loadAllocatedReplay(data,fromLegacy,{async selectReplay(){return 1;},async readReplay(){return legacyBytes.slice();},replayPhysicsEngine(){return 'ms-1990';},replayFramesPerSecond(){return 20;},showWaiting(){},progress(){},writeAudio(){}});
assert.ok(backToLegacy);assert.equal(backToLegacy.session.physicsEngine,'ms-1990');assert.equal(backToLegacy.session.framesPerSecond,20);
const freshLegacy=await createNativeReplayRaceSession({...data,physicsEngine:'ms-1990',framesPerSecond:20},{...menu,configuration:Array.from(legacyBytes.slice(0,24)),track:Array.from(legacyBytes.slice(24,0x722))},{bytes:new Uint8Array(legacyBytes),name:'OLD',path:'C:\\',physicsEngine:'ms-1990',framesPerSecond:20},{resetMouse(){},async key(){return 27;}});
if(process.env.SLOW_LOAD_DIAGNOSTICS==='1')for(const frame of [0,1,20,100]){
 for(const next of [backToLegacy,freshLegacy]){next.session.seek(0);next.session.seek(frame);}
 const actual=readRecordedTwoCarRace(backToLegacy.session.state.memory,0x2d1a0).player.driving.car,expected=readRecordedTwoCarRace(freshLegacy.session.state.memory,0x2d1a0).player.driving.car;
 console.log(JSON.stringify({legacyFrame:frame,actualPose:actual.pose,expectedPose:expected.pose,actualSpeed:actual.engine.speed,expectedSpeed:expected.engine.speed,actualCrash:actual.grip.crash,expectedCrash:expected.grip.crash}));
}
backToLegacy.session.seek(0);backToLegacy.session.seek(backToLegacy.session.length);
// Legacy deferred-entry snapshots predate initialization. Build an independent
// sequential reference instead of comparing two different snapshot lifecycles.
freshLegacy.session.initializeLoadedReplay();
freshLegacy.session.state.memory[0x2d1a0+0x9aca]=1;freshLegacy.session.state.memory[0x2d1a0+0xa3c2]=2;
for(let frame=0;frame<legacyBytes.length-0x722;frame++){
 captureOriginalRaceInput(freshLegacy.session.state.memory,0x2d1a0,legacyBytes[0x722+frame],20);
 freshLegacy.session.originalMemory.writeMemory(freshLegacy.session.state.memory);
 freshLegacy.session.advanceCaptured({entryStackPointer:0xfefc,incomingSI:legacyBytes.length-0x722-frame});
}
assert.deepEqual(readRecordedTwoCarRace(backToLegacy.session.state.memory,0x2d1a0).player.driving.car,readRecordedTwoCarRace(freshLegacy.session.state.memory,0x2d1a0).player.driving.car,'Return to legacy must match a fresh interpretation of the same reference');
console.log('Legacy reference endpoint status: '+freshLegacy.session.state.player.driving.car.grip.crash);
assert.equal(backToLegacy.session.state.memory[0x2d1a0+0x8018]&1,0);
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),legacyBefore);
assert.deepEqual(readFileSync(path),original);
console.log('Legacy20→MS9110→legacy20 restores identity; MS91 finishes and legacy endpoint matches independent sequential playback; sources preserved');
