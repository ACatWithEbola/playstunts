import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {browserUsesTimedMt32,createBrowserTimedMt32Session,reconstructTimedMt32Resources} from '../lib/game/browser-timed-mt32-session.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
for(const hostname of ['localhost','playstunts.com','www.playstunts.com']){
 assert.equal(browserUsesTimedMt32({hostname,search:''},'mt32','ms-1991'),true);
 assert.equal(browserUsesTimedMt32({hostname,search:''},'mt32','ms-1990'),false);
 for(const sound of ['tandy','pc-speaker',undefined])assert.equal(browserUsesTimedMt32({hostname,search:'?preview-mt32=timed'},sound,'ms-1991'),false);
}
assert.equal(browserUsesTimedMt32({hostname:'localhost',search:'?preview-mt32=timed'},'mt32','ms-1990'),false,'Retired query cannot change legacy audio');
assert.equal(browserUsesTimedMt32({hostname:'playstunts.com',search:'?preview-mt32=timed'},'mt32','ms-1990'),false);
assert.equal(browserUsesTimedMt32({hostname:'localhost',search:'?preview-mt32=timed'},'mt32','bb-1991'),false);
const originalFetch=globalThis.fetch;
globalThis.fetch=(async(input:RequestInfo|URL)=>new Response(readFileSync('public'+String(input)),{status:200})) as typeof fetch;
try{
 for(const generation of ['ms-1990','ms-1991'] as const){
  let wall=0,physicalCloses=0;
  const device={sampleRate:32000,active:()=>false,write(){},render(frames:number){return new Float32Array(frames*2);},close(){physicalCloses++;}};
  let live:typeof device|undefined=device;
  const power={get device(){return live;},output:device,async powerOn(){live=device;return true;},close(){physicalCloses++;}};
  const patch=new Uint8Array([1,2,3]),profile={cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},cancelled:()=>false,yieldTask:async()=>{}};
  const session=await createBrowserTimedMt32Session({context:{} as AudioContext,signal:new AbortController().signal,power:power as any,generation,patch,profile,clock:{callbackCounter:100,gameCounter:20,divisor:5,countdown:5},wallTicks:()=>wall});
  patch[0]=255;profile.pollCycles=200;
  const first=session.race();assert.equal(first.generation,generation);assert.deepEqual(first.patch,new Uint8Array([1,2,3]));assert.equal(first.profile.pollCycles,20);
  first.patch[0]=99;first.profile.pollCycles=100;assert.deepEqual(session.race().patch,new Uint8Array([1,2,3]));assert.equal(session.race().profile.pollCycles,20);
  await session.music.controlAsync('toggle-music');await session.music.playAsync('titl');assert.equal(session.clock.source,'wall');
  wall=9;assert.equal(session.clock.inputClock.counter(),9);
  const retained={callbackCounter:5000,gameCounter:1001,divisor:5,countdown:3};await session.restoreMenuClock(retained);retained.countdown=99;
  assert.equal(session.clock.snapshot().countdown,3);assert.equal(session.clock.inputClock.counter(),9);
  live=undefined;assert.throws(()=>session.race(),{name:'AbortError'});await assert.rejects(first.stopMusic(),{name:'AbortError'});
  const release=session.closeAsync();assert.equal(session.closeAsync(),release);await release;
  assert.throws(()=>session.race(),{name:'AbortError'});assert.equal(physicalCloses,0);
  const startupController=new AbortController(),signal=startupController.signal;
  let listeners=0,reads=0;
  const add=signal.addEventListener.bind(signal),remove=signal.removeEventListener.bind(signal);
  signal.addEventListener=((...args:Parameters<typeof add>)=>{if(args[0]==='abort')listeners++;add(...args);}) as typeof signal.addEventListener;
  signal.removeEventListener=((...args:Parameters<typeof remove>)=>{if(args[0]==='abort')listeners--;remove(...args);}) as typeof signal.removeEventListener;
  const replacement={...device};
  const changingPower={get device(){return ++reads>=4?replacement:device;},output:device,async powerOn(){return true;},close(){physicalCloses++;}};
  await assert.rejects(createBrowserTimedMt32Session({context:{} as AudioContext,signal,power:changingPower as any,generation,patch,profile,clock:{callbackCounter:0,gameCounter:0,divisor:5,countdown:5},wallTicks:()=>0}),{name:'AbortError'});
  assert.equal(listeners,0,'Failed startup handover removes music abort listener');assert.equal(physicalCloses,0,'Failed handover does not close either caller-owned device');
 }
}finally{globalThis.fetch=originalFetch;}
function* resource(){assert.equal(yield {kind:'read' as const,port:0x331},0);yield {kind:'write' as const,port:0x330,value:12};return 7;}
assert.deepEqual(reconstructTimedMt32Resources(resource()),{result:7,writes:[[0x330,12]]});
console.log('Modern Roland selects timed delivery without a QA flag; retired queries cannot change legacy audio; session snapshots identity/profile and retains clock/device ownership');
