/** Genuine recorded-control passage, no transplanted pose or state. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {landmarkContact} from '../lib/physics/landmark-contact.ts';
import type {Vector} from '../lib/physics/math.ts';
const path=process.argv[2];assert.ok(path);
const source=readFileSync(path),{bytes,framesPerSecond}=decodeVersionedReplay(source,'ms-1991'),raw=Array.from(bytes.slice(24,0x722));
const id=String.fromCharCode(...bytes.slice(0,4)),carData=fixtureData.cars.find((car:{id:string})=>car.id===id);assert.ok(carData);
const simulation=Buffer.from(carData.rawSimulation,'hex'),dimensions=[200,202,204].map(at=>simulation.readInt16LE(at)) as Vector,radius=simulation.readInt16LE(206);
const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1991',framesPerSecond},
 {configuration:Array.from(bytes.slice(0,24)),track:raw,name:'DIVIDER',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
race.session.skipIntroduction();const verified:unknown[]=[];
for(let frame=0;frame<bytes.length-0x722;frame++){
 captureOriginalRaceInput(race.session.state.memory,0x2d1a0,bytes[0x722+frame],framesPerSecond,'ms-1991');
 race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
 const car=race.session.state.player.driving.car;assert.ok(car.grip.crash===0||car.grip.crash===3,'Recorded run must not crash');
 const position=car.pose.position.map(v=>v>>6) as Vector,[x,y,z]=position,column=x>>10,row=29-(z>>10);
 const element=column>=0&&column<30&&row>=0&&row<30?raw[row*30+column]:0;
 if((element===109||element===110)&&y>=24&&y<120&&car.grip.allContact>0){
  const body={position,angles:car.pose.rotation,dimensions,radius};
  const actual=landmarkContact(body,raw,fixtureData.objects,450,car.grip.wheelAngle);
  const lowered=landmarkContact({...body,position:[x,0,z]},raw,fixtureData.objects,450,car.grip.wheelAngle);
  if(lowered.hit){assert.equal(actual.hit,false,'Raised car must clear the tree that would collide at ground level');verified.push({frame:frame+1,position,allContact:car.grip.allContact});}
 }
}
assert.ok(verified.length>0,'Replay must cross an actual ground-level tree collision volume while raised and in contact');
assert.equal(race.session.state.player.driving.car.grip.crash,3,'Genuine recording must finish');
assert.deepEqual(readFileSync(path),source);
console.log(JSON.stringify({engine:'ms-1991',car:id,verifiedTreeCrossings:verified,finished:true,sourceUnchanged:true,seededState:false}));
