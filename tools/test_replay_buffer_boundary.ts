import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
import {handleNativeRecordingFull} from '../lib/game/native-recording-full.ts';

// A fresh stationary race uses only the bundled track/car configuration.
// It does not relabel or replay the legacy fixture's recorded control stream.
const path=new URL('../public/game/replays/CTKFIN.RPL',import.meta.url),source=readFileSync(path);
// The full-buffer dialog must handle all original user exits without a
// simulation crash: Continue Now, See Replay, and Escape (Continue Now).
for(const choice of [0,1,65535]){
 const calls:string[]=[],state={pending:1,done:0};
 await handleNativeRecordingFull({suspendInput(){calls.push('suspend');},pauseAudio(){calls.push('pause');},async dialog(resource,mode,selected){assert.equal(resource,'erbf');assert.equal(mode,2);assert.equal(selected,0);return choice;},resumeAudio(){calls.push('resume-audio');},resetCounter(){calls.push('counter');},resumeInput(){calls.push('resume-input');},raceEvent(mode,value){assert.equal(mode,4);assert.equal(value,0);calls.push('replay');}},state);
 assert.deepEqual(calls,['suspend','pause','resume-audio','counter','resume-input',...(choice===1?['replay']:[])]);
 assert.deepEqual(state,{pending:0,done:choice===1?1:0});
}
for(const [physicsEngine,framesPerSecond] of [['ms-1990',20],['ms-1991',20],['ms-1991',10]] as const){
 const race=await createNativeManualRaceSession({...fixtureData,physicsEngine,framesPerSecond,experimental10Hz:framesPerSecond===10},{configuration:Array.from(source.slice(0,24)),track:Array.from(source.slice(24,0x722)),name:'BOUNDARY',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 race.session.skipIntroduction();let prompts=0;
 for(let tick=0;tick<12005;tick++){
  let capture=captureOriginalRaceInput(race.session.state.memory,0x2d1a0,2,framesPerSecond,physicsEngine);
  if(capture.action==='continue-prompt'){
   assert.equal(tick,12000,'Buffer becomes full after12000 recorded frames');prompts++;
   // Exercise the real session action at the actual boundary, then restore
   // this isolated checkpoint to test each exit independently.
   const boundaryMemory=race.session.state.memory,boundary=boundaryMemory.slice(),d=0x2d1a0;
   race.session.resumeRecording(1);
   assert.equal(boundaryMemory[d+0xaa77],0);
   assert.equal(boundaryMemory[d+0x8ff4],1);
   assert.equal(boundaryMemory[d+0x8eac],4,'See Replay requests replay rather than a crash');
   assert.equal(new DataView(boundaryMemory.buffer).getUint16(d+0x8c1e,true),1);
   boundaryMemory.set(boundary);
   race.session.resumeRecording(65535);
   assert.equal(boundaryMemory[d+0xaa77],0);
   assert.equal(boundaryMemory[d+0x8ff4],boundary[d+0x8ff4],'Escape does not end the race');
   boundaryMemory.set(boundary);
   const calls:string[]=[],state={pending:1,done:0};
   await handleNativeRecordingFull({suspendInput(){calls.push('suspend');},pauseAudio(){calls.push('pause');},async dialog(resource){assert.equal(resource,'erbf');calls.push('dialog');return 0;},resumeAudio(){calls.push('resume-audio');},resetCounter(){calls.push('counter');},resumeInput(){calls.push('resume-input');},raceEvent(){throw Error('Continue Now must not exit the race');}},state);
   assert.deepEqual(calls,['suspend','pause','dialog','resume-audio','counter','resume-input']);assert.deepEqual(state,{pending:0,done:0});
   race.session.resumeRecording(0);capture=captureOriginalRaceInput(race.session.state.memory,0x2d1a0,2,framesPerSecond,physicsEngine);
  }
  assert.equal(capture.recorded,true);race.session.originalMemory.writeMemory(race.session.state.memory);race.session.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
 }
 assert.equal(prompts,1);assert.equal(race.session.state.player.driving.car.grip.crash,0);
 const v=new DataView(race.session.state.memory.buffer),d=0x2d1a0;
 assert.equal(v.getUint16(d+0x73b2,true),12005-30*framesPerSecond);assert.equal(v.getUint16(d+0xa034,true),30*framesPerSecond);
 assert.deepEqual(readFileSync(path),source);
 console.log(`${physicsEngine}/${framesPerSecond}Hz: ${12000/framesPerSecond}-second boundary prompts once; Continue Now restores input/audio and recording rolls over without crash through12005 ticks`);
}
