import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureData,finishedScoreFixture} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {captureGlobalRace} from '../lib/game/global-race-recording.ts';
import {selectOriginalReplayControl} from '../lib/game/replay-control-selection.ts';
test('production observer records hardware inputs, blocks continue at replay end, and clears on Restart',async()=>{
 const proof=await finishedScoreFixture(),runtime=await createNativeManualRaceRuntime(fixtureData,{configuration:proof.replay.slice(0,24),track:proof.replay.slice(24,0x722),name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}}),history=captureGlobalRace(runtime);
 const devices={mouse:()=>({x:160,y:100,buttons:0}),joystickSteering:()=>0,controls:()=>1,keyDown:()=>0};
 runtime.tick({...devices,controls:()=>0});runtime.session.skipIntroduction();
 for(let i=0;i<100;i++)runtime.tick(devices);
 assert.equal(history.inputs.length,runtime.session.length);assert.ok(history.inputs.every(n=>n===1));
 runtime.session.seek(runtime.session.length);
 const host={resetCounter(){},resetMouse(){},async dialog(){return 1;},selectControl(_mode:number,selected:number){selectOriginalReplayControl(runtime.session.state.memory,0x2d1a0,selected);}};
 await runtime.session.continueReplay(false,host);assert.equal(history.continued,true);assert.equal(runtime.session.state.memory[0x2d1a0+0x8018],1,'Original replay-end continuation may keep flag 1; online eligibility still rejects it');
 runtime.session.seek(runtime.session.length);await runtime.session.continueReplay(true,host);assert.equal(history.continued,false);assert.equal(history.inputs.length,0);
 for(let i=0;i<100;i++)runtime.tick(devices);assert.equal(history.inputs.length,runtime.session.length);
});
