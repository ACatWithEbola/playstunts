import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeReplayRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {captureGlobalRace} from '../lib/game/global-race-recording.ts';
import {completedScoreProof} from '../lib/game/completed-score-offer.ts';
import type {GlobalScoreContext} from '../lib/game/global-score-file-store.ts';
const bytes=new Uint8Array(readFileSync('public/game/replays/CTKFIN.RPL')),source=bytes.slice();
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 const runtime=await createNativeReplayRaceRuntime({...fixtureData,physicsEngine},{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'CONTQA',camera:0,graphics:2,soundEnabled:false},{bytes,name:'CONTQA',path:'',physicsEngine,framesPerSecond:20},{resetMouse(){},async key(){return 0;}});
 const history=captureGlobalRace(runtime);
 assert.equal(history.continued,true,'Loaded replay is already ineligible');
 const host={resetCounter(){},releaseDrivingInput(){},async dialog(){return 1;},selectControl(){},resetMouse(){}};
 assert.equal(await runtime.session.continueReplay(true,host),true);
 assert.equal(history.continued,false,'Explicit fresh restart clears continuation identity');
 assert.equal(history.total,0);assert.deepEqual(history.inputs,[]);
 runtime.session.reset();
 assert.equal(await runtime.session.continueReplay(false,host),true);
 assert.equal(history.continued,true,'Actual wrapped continuation marks browser history even at recorded end');
 const context={runtime,history,state:{panel:{flags:1,playerTime:100,opponentSelected:0,opponentTime:0}}} as unknown as GlobalScoreContext;
 assert.equal(await completedScoreProof(context,1),undefined,'Even an otherwise eligible finish cannot obtain a public proof');
}
assert.deepEqual(bytes,source);
console.log('Both actual native continuation observers block public proofs at recorded end; only fresh restart resets identity; source unchanged');
