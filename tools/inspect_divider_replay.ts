/** Read-only trace to locate divider/tree passages; not original DOS parity. */
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {landmarkContact} from '../lib/physics/landmark-contact.ts';
import {trackCollisionPoints} from '../lib/physics/track-collision-points.ts';
import type {Vector} from '../lib/physics/math.ts';
import {readRecordedTwoCarRace} from '../lib/game/recorded-two-car-race.ts';
import {writePlayerRaceState} from '../lib/game/write-player-race-state.ts';
import {initialMs91BodyCaches,writeMs91BodyCaches} from '../lib/game/ms91-body-cache-memory.ts';
const path=process.argv[2];if(!path)throw Error('Usage: node tools/inspect_divider_replay.ts CANONICAL.RPL');
const bytes=new Uint8Array(readFileSync(path)),count=new DataView(bytes.buffer).getUint16(22,true);
assert.equal(bytes.length,0x722+count);
let dividerState:Uint8Array|undefined;
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const race=await createNativeManualRaceSession({...fixtureData,physicsEngine},{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'SKIDS',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 race.session.skipIntroduction();let previous='',firstCrash:number|undefined;const transitions:unknown[]=[];
 for(let frame=0;frame<count;frame++){
  captureOriginalRaceInput(race.session.state.memory,0x2d1a0,bytes[0x722+frame],20,physicsEngine);race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
  const car=race.session.state.player.driving.car,[x,y,z]=car.pose.position,col=x>>16,row=z>>16;
  if(physicsEngine==='ms-1990'&&frame+1===1504)dividerState=race.session.state.memory.slice();
  const tile=col>=0&&col<30&&row>=0&&row<30?bytes[24+row*30+col]:-1,key=col+','+row;
  if(car.grip.crash&&car.grip.crash!==3)firstCrash??=frame+1;
  if(key!==previous){transitions.push({frame:frame+1,col,row,tile,height:y,crash:car.grip.crash});previous=key;}
 }
 if(!process.argv.includes('--controlled'))console.log(JSON.stringify({physicsEngine,firstCrash:firstCrash??null,finished:race.session.state.player.driving.car.grip.crash===3,transitions}));
}
if(process.argv.includes('--controlled')){
 assert.ok(dividerState,'Reference must reach the divider-state frame');
 for(const physicsEngine of ['ms-1990','ms-1991'] as const){
  const race=await createNativeManualRaceSession({...fixtureData,physicsEngine},{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'SKIDS',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
  if(physicsEngine==='ms-1990')race.session.originalMemory.writeMemory(dividerState.slice());
  else{
   // Controlled physics probe only: copy decoded player state, not the old
   // allocator/resource/checkpoint bank. This is not replay conversion.
   const d=0x2d1a0,reference=readRecordedTwoCarRace(dividerState,d),memory=race.session.state.memory.slice();
   memory.set(writePlayerRaceState(memory.subarray(d,d+65536),reference.player,reference.player,reference.camera,reference.done),d);
   memory.set(dividerState.subarray(d+0x8c44,d+0x8c50),d+0x8c44);
   new DataView(memory.buffer).setUint16(d+0x73b2,1504,true);
   memory[d+0x8eab]=dividerState[d+0x8eab];memory[d+0xa3c2]=dividerState[d+0xa3c2];
   race.session.originalMemory.writeMemory(writeMs91BodyCaches(memory,d,20,initialMs91BodyCaches(memory,d)));
  }
  const initial=race.session.state.player.driving.car.pose.position.slice();
  const carId=String.fromCharCode(...bytes.slice(0,4)),carData=fixtureData.cars.find((car:{id:string;rawSimulation:string})=>car.id===carId)!;
  const sim=Buffer.from(carData.rawSimulation,'hex'),dimensions=[200,202,204].map(at=>sim.readInt16LE(at)) as Vector,radius=sim.readInt16LE(206),raw=Array.from(bytes.slice(24,0x722));
  let closeTreeFrames=0;
  for(let frame=1504;frame<1550;frame++){
   captureOriginalRaceInput(race.session.state.memory,0x2d1a0,bytes[0x722+frame],20,physicsEngine);race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
   assert.equal(race.session.state.player.driving.car.grip.crash,0,'Controlled divider-top contact frame '+(frame+1)+' '+physicsEngine);
   const car=race.session.state.player.driving.car,position=car.pose.position.map(value=>value>>6) as Vector,column=position[0]>>10,row=29-(position[2]>>10);
   const points=trackCollisionPoints(raw,fixtureData.objects,column,row,450);
   if(points.some(point=>Math.hypot(point[0]-position[0],point[2]-position[2])<=radius+10)){
    closeTreeFrames++;
    assert.equal(landmarkContact({position,angles:car.pose.rotation,dimensions,radius},raw,fixtureData.objects,450,car.grip.wheelAngle).hit,false,'Actual raised car clears nearby divider tree volume');
   }
  }
  const final=race.session.state.player.driving.car.pose.position;
  assert.ok(Math.abs(final[0]-initial[0])>65536,'Controlled car must move across multiple divider tiles');
  assert.ok(closeTreeFrames>0,'Controlled passage must actually approach a collision point');
  console.log(JSON.stringify({controlledDivider:physicsEngine,firstFrame:1504,lastFrame:1550,initial,final,closeTreeFrames,crashed:false}));
 }
}
assert.deepEqual(new Uint8Array(readFileSync(path)),bytes);
