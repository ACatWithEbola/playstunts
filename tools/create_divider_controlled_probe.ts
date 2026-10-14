/** Temporary, explicitly non-publishable state probe from an unchanged replay. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {encodeVersionedReplay} from '../lib/game/versioned-replay-file.ts';
const [source,output]=process.argv.slice(2);
assert.ok(source&&output&&isAbsolute(source)&&isAbsolute(output));
const bytes=readFileSync(source),count=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint16(22,true);
assert.equal(bytes.length,0x722+count);assert.ok(count>=1550);
const race=await createNativeManualRaceSession({...fixtureData,physicsEngine:'ms-1990'},{configuration:Array.from(bytes.slice(0,24)),track:Array.from(bytes.slice(24,0x722)),name:'SKIDS',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
race.session.skipIntroduction();
for(let frame=0;frame<1504;frame++){
 captureOriginalRaceInput(race.session.state.memory,0x2d1a0,bytes[0x722+frame]);
 race.session.originalMemory.writeMemory(race.session.state.memory);
 race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
}
const car=race.session.state.player.driving.car;
assert.equal(car.grip.crash,0);
const native=race.session.state.memory.slice(0x2d1a0+0x8c38,0x2d1a0+0x8c38+184),modern=Buffer.alloc(208);
modern.set(native.slice(0,140));modern.set(native.slice(140),164);
// Modern added body-coordinate cache starts as the corresponding world wheel
// positions; the original chassis updates it during the controlled passage.
assert.ok(car.wheelPositions&&car.wheelPositions.length===4);
car.wheelPositions.forEach((p,i)=>p.forEach((v,a)=>modern.writeInt16LE(v,140+i*6+a*2)));
writeFileSync(join(output,'divider-car.bin'),modern,{flag:'wx'});
writeFileSync(join(output,'divider-controls-ms91.rpl'),encodeVersionedReplay(Uint8Array.from(bytes),'ms-1991',20),{flag:'wx'});
assert.deepEqual(readFileSync(source),bytes);
console.log(JSON.stringify({frame:1504,position:car.pose.position,inputStart:1504,steps:46,sourceUnchanged:true,controlledProbeOnly:true}));
