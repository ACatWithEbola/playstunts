import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {importVersionedReplay} from '../lib/game/versioned-replay-file.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {runAllocatedRaceResults} from '../lib/game/native-allocated-race-results.ts';
const source=Buffer.from(readFileSync(new URL('./fixtures/ms91-qa91r001.hex',import.meta.url),'utf8').trim(),'hex');
const replay=importVersionedReplay(source,'ms-1991'),configuration=Array.from(replay.subarray(0,24)),track=Array.from(replay.subarray(24,0x722));
let cases=0;
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine},{configuration,track,name:'SHORT',camera:0,graphics:2,soundEnabled:false},{resetMouse(){}});
 runtime.session.skipIntroduction();const baseline=runtime.session.state.memory.slice();
 for(const length of [0,1,51,52,363,364]){
  runtime.session.originalMemory.writeMemory(baseline.slice());
  const incoming=Uint8Array.from({length},(_,i)=>(i*17+3)&255),incomingBefore=incoming.slice();let prepared=false;
  await runAllocatedRaceResults(fixtureData,runtime,{progress(){},async readFile(name){
   if(/\.TRK$/i.test(name))return Uint8Array.from(track);
   assert.match(name,/\.HIG$/i);return incoming;
  },async writeFile(){throw Error('Existing even-empty score file must not be replaced');},async insertTrackDisk(){throw Error('Matching isolated track requires no disk retry');},async present(state,services){
   state.scores.file.fill(0x7d);
   const expected=new Uint8Array(364).fill(0x7d);expected.set(incoming);
   await services.prepareScores!(state);prepared=true;
   assert.deepEqual(state.scores.file,expected,`${physicsEngine} short read${length}`);
   return 2;
  }});
  assert.equal(prepared,true);assert.deepEqual(incoming,incomingBefore);cases++;
 }
 for(const scenario of ['missing-cancel','missing-retry','mismatch'] as const){
  runtime.session.originalMemory.writeMemory(baseline.slice());
  let reads=0,prompts=0,prepared=false;
  await runAllocatedRaceResults(fixtureData,runtime,{progress(){},async readFile(name){
   assert.match(name,/\.TRK$/i,'Unavailable track must prevent score-file reads');reads++;
   if(scenario!=='mismatch')return null;
   const different=Uint8Array.from(track);different[0]^=1;return different;
  },async writeFile(){assert.fail('Unavailable/mismatched track must not create a score file');},async insertTrackDisk(){prompts++;return scenario==='missing-retry'?1:0;},async present(state,services){
   const scoresBefore=state.scores.file.slice();
   const eligibility=await services.prepareScores!(state);prepared=true;
   assert.equal(eligibility.status,255,'Original results suppress score saving without matching track');
   assert.deepEqual(state.scores.file,scoresBefore,'Existing score buffer remains unchanged');
   return 2;
  }});
  assert.equal(prepared,true);assert.equal(prompts,scenario==='mismatch'?0:1);assert.equal(reads,scenario==='missing-retry'?2:1);cases++;
 }
}
console.log(JSON.stringify({scoreReadCases:cases,bothEngines:true,emptyFilesRetained:true,missingTrackCancelRetryAndMismatch:true,untouchedTailPreserved:true,noScoreWrites:true,pass:true}));
