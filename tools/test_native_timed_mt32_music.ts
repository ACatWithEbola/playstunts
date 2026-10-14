import assert from 'node:assert/strict';
import {createNativeTimedMt32Music} from '../lib/game/native-timed-mt32-music.ts';
import {createSynchronizedRemixedMusic} from '../lib/game/remixed-music.ts';
const context={currentTime:0,createGain(){assert.fail('Cancelled startup must not allocate browser audio');}} as unknown as AudioContext;
let entered:()=>void=()=>{},release:()=>void=()=>{},closed=0,released=0,created=0;
const reached=new Promise<void>(resolve=>{entered=resolve;});
const music=createNativeTimedMt32Music(context,async(name,cancelled)=>{
 created++;assert.equal(name,'slct');entered();await new Promise<void>(resolve=>{release=resolve;});
 assert.equal(cancelled(),true);
 return {score:{close(){closed++;}} as any,async release(){released++;}};
});
assert.throws(()=>music.play('titl'),/playAsync/);
const start=music.playAsync('slct');const rejected=assert.rejects(start,{name:'AbortError'});
await reached;music.stop();release();await rejected;
assert.equal(created,1);assert.equal(closed,1);assert.equal(released,1);
assert.equal(await music.controlAsync('toggle-music'),0);
await music.playAsync('titl');assert.equal(created,1,'Disabled music does not create score');
await music.closeAsync();await assert.rejects(music.playAsync('titl'),{name:'AbortError'});
console.log('Timed native music cancels pending score creation, releases stale score once, honors disabled music and rejects closed startup; no physical audio claim');

const sources:{stopped:number;buffer:unknown}[]=[],events:string[]=[];
const runningContext={currentTime:0,state:'running',destination:{},
 createGain(){return {gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}};},
 createBuffer(_channels:number,frames:number){return {getChannelData:()=>new Float32Array(frames)};},
 createBufferSource(){const source={buffer:null as unknown,onended:null,stopped:0,connect(){},start(){events.push('scheduled');},stop(){this.stopped++;},disconnect(){}};sources.push(source);return source;},
} as unknown as AudioContext;
let gapRender=0;(runningContext as unknown as {currentTime:number}).currentTime=0;
const gapProbe=createNativeTimedMt32Music(runningContext,async()=>({score:{sampleRate:32000,async render(){if(++gapRender===5)(runningContext as unknown as {currentTime:number}).currentTime=.2;return new Float32Array(1024);},close(){}} as any,async release(){}}));
await gapProbe.playAsync('titl');
const gap=gapProbe.deliveryDiagnostics.largestGap;assert.ok(gap);
assert.ok(Math.abs(gap.gap-.136)<1e-9);assert.equal(gap.frameStart,2048);assert.equal(gap.frameEnd,2560);
assert.equal(gap.renderStartedAt,0);assert.equal(gap.renderFinishedAt,.2);
gap.frameStart=-1;assert.equal(gapProbe.deliveryDiagnostics.largestGap!.frameStart,2048,'Diagnostics cannot mutate retained provenance');
await gapProbe.closeAsync();(runningContext as unknown as {currentTime:number}).currentTime=0;
sources.length=0;events.length=0;
console.log('Largest scheduling gap retains copied frame/render-clock provenance without changing transport');
let releaseOld:()=>void=()=>{},oldReleaseEntered:()=>void=()=>{};
const releaseReached=new Promise<void>(resolve=>{oldReleaseEntered=resolve;});
const running=createNativeTimedMt32Music(runningContext,async name=>{
 events.push('create:'+name);let state={musicEnabled:1,soundEnabled:1,paused:0};
 const score={sampleRate:32000,async render(){return new Float32Array(1024);},
  async control(operation:string){events.push(operation);if(operation==='pause-audio')state.paused=1;if(operation==='resume-audio')state.paused=0;if(operation==='toggle-sound')state.soundEnabled=1-state.soundEnabled;if(operation==='toggle-music')state.musicEnabled=1-state.musicEnabled;return operation==='toggle-sound'?state.soundEnabled:operation==='toggle-music'?state.musicEnabled:0;},
  get settings(){return state;},close(){events.push('close:'+name);},async fadeOut(_wait:unknown,stop:()=>void){events.push('fade:'+name);stop();},
 };
 return {score:score as any,async release(){events.push('release:'+name);if(name==='titl'){oldReleaseEntered();await new Promise<void>(resolve=>{releaseOld=resolve;});}}};
});
await running.playAsync('titl');assert.ok(sources.length>0);
assert.equal(running.hasScore,true);
assert.equal(running.playbackStartAt,.015,'Controller exposes actual first scheduled buffer anchor');
assert.throws(()=>running.control('pause-audio'),/controlAsync/);
await running.controlAsync('pause-audio');assert.equal(running.settings.paused,true);
assert.ok(sources.every(source=>source.stopped===1),'Pause must cancel queued browser sound, including original synth tails');
const pausedSourceCount=sources.length;
await running.controlAsync('resume-audio');assert.equal(running.settings.paused,false);
assert.equal(sources.length,pausedSourceCount,'Resume delivery alone must not schedule stale pre-pause sound');
await running.controlAsync('toggle-sound');assert.equal(running.settings.soundEnabled,false);
const replacement=running.playAsync('slct');await releaseReached;
assert.equal(running.playbackStartAt,undefined,'Old song anchor must not leak into replacement startup');
assert.ok(!events.includes('create:slct'),'Old device release must finish before next score factory');
assert.ok(sources.every(source=>source.stopped===1),'Replacing score drops old scheduled browser sound');
releaseOld();await replacement;
assert.ok(events.indexOf('release:titl')<events.indexOf('create:slct'));
assert.equal(running.settings.soundEnabled,false,'Sound-effects setting retained across score change');
assert.equal(await running.controlAsync('toggle-music'),0);
assert.ok(sources.every(source=>source.stopped===1),'Disabling music must suspend queued browser audio before host clock handover');
assert.equal(await running.controlAsync('toggle-music'),1);
assert.equal(running.settings.musicEnabled,true);
await running.fadeOut(async()=>{});await running.closeAsync();
assert.equal(running.hasScore,false,'Released song must not retain active ownership');
assert.equal(events.filter(event=>event==='close:slct').length,1);
assert.equal(events.filter(event=>event==='release:slct').length,1);
console.log('Timed native successful playback, awaited controls, retained settings, release-before-replacement and fade cleanup pass with fake Web Audio');
let handoffEntered:()=>void=()=>{},handoffRelease:()=>void=()=>{},handoffDone=false;
const handoffReached=new Promise<void>(resolve=>{handoffEntered=resolve;});
const handoff=createNativeTimedMt32Music(runningContext,async()=>({score:{sampleRate:32000,async render(){return new Float32Array(1024);},close(){},get settings(){return {musicEnabled:1,soundEnabled:1,paused:0};}} as any,async release(){handoffEntered();await new Promise<void>(resolve=>{handoffRelease=resolve;});}}));
await handoff.playAsync('titl');
const stopping=handoff.stopAsync().then(()=>{handoffDone=true;});await handoffReached;
assert.equal(handoffDone,false,'Race handoff must wait for device release');
handoffRelease();await stopping;assert.equal(handoffDone,true);await handoff.closeAsync();
console.log('Awaited stop holds race handoff until prior song device release completes');

{
 let closes=0,releases=0;
 const offset=sources.length,error=Error('Scheduled host wait failed');
 const failed=createNativeTimedMt32Music(runningContext,async()=>({score:{sampleRate:32000,async render(){return new Float32Array(1024);},close(){closes++;},async fadeOut(wait:()=>Promise<void>){await wait();}} as any,async release(){releases++;}}));
 await failed.playAsync('slct');
 await assert.rejects(failed.fadeOut(async()=>{throw error;}),caught=>caught===error);
 assert.equal(failed.hasScore,false,'Failed scheduled fade must relinquish the score');
 assert.ok(sources.slice(offset).every(source=>source.stopped===1),'Failed scheduled fade cancels queued synth audio');
 assert.equal(closes,1);assert.equal(releases,1);await failed.closeAsync();
 assert.equal(closes,1);assert.equal(releases,1);
}
for(const operation of ['fade','close','stop'] as const){
 const cleanupError=new Error('Device release failed: '+operation);let factories=0;
 const failed=createNativeTimedMt32Music(runningContext,async()=>{
  factories++;
  return {score:{sampleRate:32000,async render(){return new Float32Array(1024);},close(){},async fadeOut(_wait:unknown,stop:()=>void){stop();}} as any,async release(){throw cleanupError;}};
 });
 await failed.playAsync('titl');
 await assert.rejects(operation==='fade'?failed.fadeOut(async()=>{}):operation==='close'?failed.closeAsync():failed.stopAsync(),error=>error===cleanupError);
 assert.equal(failed.failure,cleanupError,'Cleanup failure must remain available to the host');
 await assert.rejects(failed.playAsync('slct'));
 assert.equal(factories,1,'Failed device cleanup must prevent creating another score');
 await assert.rejects(failed.closeAsync(),error=>error===cleanupError);
}
console.log('Fade, Stop and Close propagate device-release failure and prevent later score creation');

let staleEntered:()=>void=()=>{},staleContinue:()=>void=()=>{},staleFactories=0;
const staleReached=new Promise<void>(resolve=>{staleEntered=resolve;});
const staleError=new Error('Cancelled score release failed');
const stale=createNativeTimedMt32Music(context,async()=>{
 staleFactories++;staleEntered();await new Promise<void>(resolve=>{staleContinue=resolve;});
 return {score:{close(){}} as any,async release(){throw staleError;}};
});
const staleStart=stale.playAsync('titl');
const staleRejection=assert.rejects(staleStart,error=>error===staleError);
await staleReached;stale.stop();staleContinue();await staleRejection;
assert.equal(stale.failure,staleError);
await assert.rejects(stale.playAsync('slct'),error=>error===staleError);
assert.equal(staleFactories,1,'Failed cancelled-score cleanup must poison the shared device too');
await assert.rejects(stale.closeAsync(),error=>error===staleError);

// Final fade delay must not begin until an already-running PCM render has
// returned. Otherwise its last hardware notification could arrive after the
// menu has switched to wall time.
let holdFadeRender=false,fadeRenderEntered:()=>void=()=>{},finishFadeRender:()=>void=()=>{},streamStopped=false;
const fadeRenderReached=new Promise<void>(resolve=>{fadeRenderEntered=resolve;});
const fading=createNativeTimedMt32Music(runningContext,async()=>({score:{
 sampleRate:32000,
 async render(){if(holdFadeRender){fadeRenderEntered();await new Promise<void>(resolve=>{finishFadeRender=resolve;});}return new Float32Array(1024);},
 close(){},async fadeOut(wait:(ticks:number)=>Promise<void>,stop:()=>Promise<void>){await stop();assert.equal(streamStopped,true);await wait(50);},
} as any,async release(){}}));
await fading.playAsync('titl');holdFadeRender=true;(runningContext as unknown as {currentTime:number}).currentTime=.5;
await fadeRenderReached;
let fadeDone=false;
const fadePending=fading.fadeOut(async ticks=>{assert.equal(ticks,50);assert.equal(streamStopped,true);},()=>{streamStopped=true;}).then(()=>{fadeDone=true;});
await new Promise<void>(resolve=>setTimeout(resolve,0));
assert.equal(streamStopped,false,'Clock handover must wait for in-flight render drain');
assert.equal(fadeDone,false);holdFadeRender=false;finishFadeRender();await fadePending;
assert.equal(streamStopped,true);assert.equal(fadeDone,true);await fading.closeAsync();
console.log('Native fade drains in-flight PCM before handing over its clock and starting the original final delay');

// Cover the wrapper and the real controller's serialized queue together. The
// original startup may finish first, but neither output may survive the fade.
for(const updated of [false,true]){
 sources.length=0;
 let factoryEntered!:()=>void,finishFactory!:()=>void,closedScores=0,releasedScores=0;
 const factoryReached=new Promise<void>(resolve=>{factoryEntered=resolve;});
 const controller=createNativeTimedMt32Music(runningContext,async()=>{
  factoryEntered();await new Promise<void>(resolve=>{finishFactory=resolve;});
  return {score:{sampleRate:32000,async render(){return new Float32Array(1024);},close(){closedScores++;},async fadeOut(_wait:unknown,stop:()=>Promise<void>){await stop();}} as any,async release(){releasedScores++;}};
 });
 const synchronized=createSynchronizedRemixedMusic(runningContext,controller,{slct:{duration:100} as AudioBuffer},updated);
 const pending=synchronized.playAsync('slct'),rejection=assert.rejects(pending,{name:'AbortError'});
 await factoryReached;
 const faded=synchronized.fadeOut(async()=>{});
 finishFactory();await faded;await rejection;
 assert.equal(controller.hasScore,false);
 assert.equal(synchronized.playbackSnapshot.score,undefined);
 assert.equal(synchronized.playbackSnapshot.hasSource,false);
 assert.equal(synchronized.playbackSnapshot.starting,false);
 assert.ok(sources.length>0,'Original controller actually scheduled browser buffers');
 assert.ok(sources.every(source=>source.stopped===1),'Fade drains all original buffers; wrapper cannot create a late remix');
 assert.equal(closedScores,1);assert.equal(releasedScores,1);
 synchronized.close();await controller.closeAsync();
}
console.log('Original/Updated wrapper fades queued during native startup settle with no score/source and release each original exactly once; mocked WebAudio');

for(const mode of ['complete','cancel','release-failure','wait-failure']){
 sources.length=0;let closedCount=0,releasedCount=0,finishWait!:()=>void,enteredWait!:()=>void;
 const waitEntered=new Promise<void>(resolve=>{enteredWait=resolve;}),ticks:number[]=[];
 const controller=createNativeTimedMt32Music(runningContext,async()=>({score:{sampleRate:32000,async render(){return new Float32Array(1024);},close(){closedCount++;},async fadeOut(){assert.fail('Continuous fade must not issue blocking device-volume commands');}} as any,async release(){releasedCount++;if(mode==='release-failure')throw Error('Device release failed');}}));
 await controller.playAsync('slct');let handovers=0;
 const fading=controller.fadeOutContinuous(async count=>{ticks.push(count);if(count===100){assert.equal(controller.hasScore,true);enteredWait();await new Promise<void>(resolve=>{finishWait=resolve;});if(mode==='wait-failure')throw Error('Transition wait failed');}else{assert.equal(count,50);assert.equal(controller.hasScore,false);}},()=>{handovers++;});
 const settled=mode==='complete'?fading:assert.rejects(fading,mode==='cancel'?{name:'AbortError'}:mode==='wait-failure'?/Transition wait failed/:/Device release failed/);
 await waitEntered;if(mode==='cancel')controller.stop();finishWait();await settled;
 assert.equal(closedCount,1);assert.equal(releasedCount,1);assert.ok(sources.every(source=>source.stopped===1));
 assert.deepEqual(ticks,mode==='complete'?[100,50]:[100]);assert.equal(handovers,mode==='complete'?1:0);
 if(mode!=='release-failure')await controller.closeAsync();else controller.close();
}
console.log('Continuous Original fade avoids device-volume commands, releases once, respects cancellation and blocks handover after release failure');
