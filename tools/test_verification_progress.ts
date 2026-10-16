import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceSession} from '../lib/game/native-manual-race-session.ts';
import {captureOriginalRaceInput} from '../lib/game/capture-race-input.ts';
test('server catch-up budget defers excess work without changing ordinary frame results',async()=>{
 const replay=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url)));
 const create=async()=>{const runtime=await createNativeManualRaceSession(fixtureData,{configuration:Array.from(replay.slice(0,24)),track:Array.from(replay.slice(24,0x722)),name:'GLOBAL',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});runtime.session.skipIntroduction();captureOriginalRaceInput(runtime.session.state.memory,0x2d1a0,replay[0x722]);runtime.session.originalMemory.writeMemory(runtime.session.state.memory);return runtime.session;};
 const bounded=await create(),ordinary=await create();
 assert.throws(()=>bounded.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0,maxFrames:0}),/Simulation progress unavailable/);
 bounded.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0,maxFrames:8});ordinary.advanceCaptured({entryStackPointer:0xeee2,incomingSI:0});
 assert.deepEqual(bounded.state.memory,ordinary.state.memory,'The safety limit does not change original simulation results');
});
