/** Local diagnostic: real runtime creation and event-loop availability.
 * No driving, saves, submission or browser-listening claims. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
const replay=readFileSync('public/game/replays/CTKFIN.RPL');
const before=Buffer.from(replay);
for(const physicsEngine of ['ms-1990','ms-1991'] as const){
 for(const kind of ['adlib','pc-speaker','tandy'] as const){
  const soundDevice=kind==='adlib'?undefined:kind==='tandy'?{kind,driverGeneration:physicsEngine,port61:()=>0,interruptCx:()=>0,bios:serviceSuppliedTandySilentRequests}:{kind,port61:()=>0};
  const start=performance.now();let timerDelay=0;
  const heartbeat=new Promise<void>(resolve=>setTimeout(()=>{timerDelay=performance.now()-start;resolve();},0));
  const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice},{configuration:Array.from(replay.subarray(0,24)),track:Array.from(replay.subarray(24,0x722)),name:'PROFILE',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}},()=>{});
  const creationMilliseconds=performance.now()-start;
  await heartbeat;
  assert.equal(runtime.session.physicsEngine,physicsEngine);
  console.log(JSON.stringify({physicsEngine,sound:kind,creationMilliseconds:+creationMilliseconds.toFixed(2),firstTimerMilliseconds:+timerDelay.toFixed(2),scope:'Node runtime startup only; not browser race loading'}));
 }
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),before);
