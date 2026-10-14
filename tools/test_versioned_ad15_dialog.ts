import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {controlNativeAllocatedDialogSound} from '../lib/game/native-race-sound-device.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');
for(const driverGeneration of ['ms-1990','ms-1991'] as const){
 const device={kind:'adlib' as const,driverGeneration},runtime=await createNativeManualRaceRuntime({...fixtureData,soundDevice:device},{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'ADPause',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer),driver=v.getUint16(d+0x4dde,true);
 for(const operation of ['pause-audio','resume-audio'] as const){
  const writes=controlNativeAllocatedDialogSound(memory,d,driver,operation,device);
  assert.equal(memory[d+0x4e02],operation==='pause-audio'?1:0);assert.equal(v.getUint16(d+0x4e0c,true),0);
  if(driverGeneration==='ms-1991')for(const [register,value] of new Map(writes.map(([r,n])=>[r,n])))assert.equal(memory[driver*16+0x97d+register],value);
 }
 runtime.renderCockpitWorld();
}
console.log('Actual allocated AdLib dialogs pause/resume both generations with balanced guards, modern cache commits and intact rendering');
