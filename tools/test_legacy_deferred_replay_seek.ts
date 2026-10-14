import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeReplayRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {readRecordedTwoCarRace} from '../lib/game/recorded-two-car-race.ts';
const references=[{name:'CTKFIN',bytes:new Uint8Array(readFileSync('public/game/replays/CTKFIN.RPL'))},{name:'DEFAULT',bytes:await fixtureData.catalog.read('DEFAULT.RPL')}];
for(const {name,bytes} of references){
assert.ok(bytes,'Required legacy reference must exist: '+name);
const before=bytes.slice(),data={...fixtureData,physicsEngine:'ms-1990' as const,framesPerSecond:20 as const};
const menu={configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'OLD',camera:0,graphics:2,soundEnabled:false},recording={bytes,name:'OLD',path:'C:\\',physicsEngine:'ms-1990' as const,framesPerSecond:20 as const};
const make=()=>createNativeReplayRaceSession(data,menu,recording,{resetMouse(){},async key(){return 27;}});
const loaded=await make(),sequential=await make();sequential.session.initializeLoadedReplay();
sequential.session.state.memory[0x2d1a0+0x9aca]=1;sequential.session.state.memory[0x2d1a0+0xa3c2]=2;
let current=0;
for(const target of [0,1,20,100,bytes.length-0x722]){
 while(current<target){
  captureOriginalRaceInput(sequential.session.state.memory,0x2d1a0,bytes[0x722+current],20);
  sequential.session.originalMemory.writeMemory(sequential.session.state.memory);
  sequential.session.advanceCaptured({entryStackPointer:0xfefc,incomingSI:target-current});current++;
 }
 loaded.session.seek(0);loaded.session.seek(target);
 const a=readRecordedTwoCarRace(loaded.session.state.memory,0x2d1a0).player.driving.car,b=readRecordedTwoCarRace(sequential.session.state.memory,0x2d1a0).player.driving.car;
 if(target===0){delete a.wheelPositions;delete b.wheelPositions;}
 assert.deepEqual(a,b,'Deferred legacy seek matches sequential controls at '+target);
 assert.equal(loaded.session.physicsEngine,'ms-1990');assert.equal(loaded.session.framesPerSecond,20);
 assert.equal(loaded.session.state.memory[0x2d1a0+0x8018]&1,0);
}
assert.deepEqual(bytes,before);
assert.deepEqual(name==='DEFAULT'?await fixtureData.catalog.read('DEFAULT.RPL'):new Uint8Array(readFileSync('public/game/replays/CTKFIN.RPL')),before);
if(name==='DEFAULT')assert.equal(loaded.session.state.player.driving.car.grip.crash,3,'Actual bundled DEFAULT must retain its finish');
console.log(name+': deferred legacy seeking matches sequential playback, preserves identity/source and remains ineligible');
}
