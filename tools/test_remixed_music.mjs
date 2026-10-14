import assert from 'node:assert/strict';
import {createSynchronizedRemixedMusic,remixedMusicTiming} from '../lib/game/remixed-music.ts';
import {browserMs91SunoScorePreview} from './ms91-suno-research-profile.ts';

class Parameter {
 value=0;
 events=[];
 cancelAndHoldAtTime(at){this.events.push(['hold',at]);}
 setValueAtTime(value,at){this.value=value;this.events.push(['set',value,at]);}
 linearRampToValueAtTime(value,at){this.value=value;this.events.push(['ramp',value,at]);}
}

class Source {
 constructor(owner){this.owner=owner;this.playbackRate={value:1};this.loop=false;this.loopStart=0;this.loopEnd=0;this.buffer=null;this.stopped=false;}
 connect(){}
 disconnect(){}
 start(at,offset){this.owner.starts.push({at,offset,rate:this.playbackRate.value,loopStart:this.loopStart,loopEnd:this.loopEnd,source:this});}
 stop(){this.stopped=true;}
}

class Context {
 currentTime=10;
 destination={};
 starts=[];
 gains=[];
 createGain(){const node={gain:new Parameter(),connect(){},disconnect(){}};this.gains.push(node);return node;}
 createBufferSource(){return new Source(this);}
}

{
 for(const [enabled,optedIn,expected] of [[false,true,'continuous'],[true,true,'updated'],[false,false,'legacy']]){
  const calls=[],ctx=new Context();
  const original={fadeTicks:100,settings:{musicEnabled:true,soundEnabled:true,paused:false},setOutputMuted(){},play(){},stop(){},close(){},control(){return 0;},
   async fadeOut(){calls.push('legacy');},async fadeOutContinuous(){calls.push('continuous');},
   async fadeOutObserved(_wait,observer){calls.push('updated');observer.volume(100,ctx.currentTime);observer.stopped();}};
  const player=createSynchronizedRemixedMusic(ctx,original,{slct:{duration:100}},enabled,remixedMusicTiming,{scheduledFade:optedIn,continuousOriginalFade:optedIn});
  player.play('slct');await player.fadeOut(async()=>{});assert.deepEqual(calls,[expected]);player.close();
 }
 console.log('MS91 Original continuous fade is opt-in; Updated scheduled fade and legacy fade routing remain unchanged');
}

{
 const ctx=new Context(),mutes=[];let finish;
 const original={fadeTicks:100,settings:{musicEnabled:true,soundEnabled:true,paused:false},setOutputMuted(...args){mutes.push(args);},play(){},stop(){},close(){},control(){return 0;},
  async fadeOut(){assert.fail('Unexpected legacy fade');},async fadeOutObserved(){assert.fail('Unexpected Updated fade');},
  fadeOutContinuous(){return new Promise(resolve=>{finish=resolve;});}};
 const player=createSynchronizedRemixedMusic(ctx,original,{slct:{duration:100},vict:{duration:100}},false,remixedMusicTiming,{scheduledFade:true,continuousOriginalFade:true});
 player.play('slct');const fading=player.fadeOut(async()=>{}),before=mutes.length;
 player.setEnabled(true);
 assert.equal(player.enabled,true,'Remember the requested mode for the next score');
 assert.equal(mutes.length,before,'Do not cancel the in-flight Original output ramp');
 assert.equal(ctx.gains[0].gain.value,0,'Do not introduce full-volume Suno during the Original fade');
 finish();await fading;
 player.play('vict');assert.equal(ctx.gains[0].gain.value,1,'Next score uses the requested Updated mode');
 const replacement=ctx.starts.at(-1).source;player.close();assert.equal(replacement.stopped,true);
 console.log('Switching mode during an Original fade preserves its ramp and applies the preference to the next score');
}

{
 for(const action of ['replace','stop','reject','late-buffer']){
  const ctx=new Context(),mutes=[];let finish,reject;
  const original={fadeTicks:100,settings:{musicEnabled:true,soundEnabled:true,paused:false},setOutputMuted(...args){mutes.push(args);},play(){},stop(){},close(){},control(){return 0;},
   async fadeOut(){},async fadeOutObserved(){},fadeOutContinuous(){return new Promise((resolve,fail)=>{finish=resolve;reject=fail;});}};
  const player=createSynchronizedRemixedMusic(ctx,original,action==='late-buffer'?{}:{slct:{duration:100},vict:{duration:100}},false,remixedMusicTiming,{scheduledFade:true,continuousOriginalFade:true});
  player.play('slct');const fading=player.fadeOut(async()=>{});player.setEnabled(true);
  if(action==='replace'){
   player.play('vict');const replacement=ctx.starts.at(-1).source;finish();await fading;
   assert.equal(replacement.stopped,false,'Stale fade must not stop its replacement');assert.equal(player.playbackSnapshot.score,'vict');
  }else if(action==='reject'){
   reject(Error('release failed'));await assert.rejects(fading,/release failed/);
   player.play('vict');assert.equal(ctx.gains[0].gain.value,1,'Failed fade must not lock future output mode');
  }else if(action==='late-buffer'){
   const before=mutes.length;player.addBuffers({slct:{duration:100}});
   assert.equal(mutes.length,before);assert.equal(ctx.starts.length,0,'Late decode cannot introduce music during exit');finish();await fading;
  }else{
   player.stop();finish();await fading;assert.equal(player.playbackSnapshot.score,undefined);assert.ok(ctx.starts.every(start=>start.source.stopped));
  }
  player.close();
 }
 console.log('Continuous fade ownership survives replacement, Stop, failure and late decoding without reviving old output');
}

{
 const scheduledContext=new Context(),gains=[];
 scheduledContext.createGain=()=>{const node={gain:new Parameter(),connect(){},disconnect(){}};gains.push(node);return node;};
 let observer,finish;
 const scheduledOriginal={fadeTicks:100,settings:{musicEnabled:true,soundEnabled:true,paused:false},setOutputMuted(){},play(){},stop(){},close(){},control(){return 0;},async fadeOut(){assert.fail('Scheduled branch must not use nominal fade');},fadeOutObserved(_wait,listener){observer=listener;return new Promise(resolve=>{finish=resolve;});}};
 const scheduled=createSynchronizedRemixedMusic(scheduledContext,scheduledOriginal,{slct:{duration:100},vict:{duration:100}},true,remixedMusicTiming,{scheduledFade:true});
 scheduled.play('slct');const fading=scheduled.fadeOut(async()=>{});
 observer.volume(100,10.2);observer.volume(50,11.7);
 assert.ok(gains[1].gain.events.some(event=>event[0]==='set'&&event[1]===.5&&event[2]===11.7));
 scheduled.setEnabled(false);scheduled.setEnabled(true);assert.equal(gains[1].gain.value,.5,'Mode switches do not reset separate fade gain');
 scheduled.play('vict');const before=gains[1].gain.events.length;observer.volume(2,12);observer.stopped();finish();await fading;
 assert.equal(gains[1].gain.events.length,before,'Superseded fade cannot alter replacement envelope');assert.equal(scheduledContext.starts.at(-1).source.stopped,false);
 const ending=scheduled.fadeOut(async()=>{});observer.volume(2,13);observer.stopped();assert.equal(scheduledContext.starts.at(-1).source.stopped,true);finish();await ending;scheduled.close();
 console.log('Scheduled remix fade follows delivered anchors, survives mode switches and cannot affect a replacement score');
}

const context=new Context(),output=[],originalPlays=[];
{
 for(const replaced of [false,true]){
  const ctx=new Context();let rejectFade;
  const original={fadeTicks:100,settings:{musicEnabled:true,paused:false},setOutputMuted(){},play(){},stop(){},close(){},control(){return 0;},fadeOutObserved(){return new Promise((_,reject)=>{rejectFade=reject;});}};
  const player=createSynchronizedRemixedMusic(ctx,original,{slct:{duration:100},vict:{duration:100}},true,remixedMusicTiming,{scheduledFade:true});
  player.play('slct');const exiting=ctx.starts.at(-1).source,fading=player.fadeOut(async()=>{});
  if(replaced)player.play('vict');
  const active=ctx.starts.at(-1).source;rejectFade(Error('Scheduled fade failed'));
  await assert.rejects(fading,/Scheduled fade failed/);
  assert.equal(exiting.stopped,true,'Failed fade must release its looping remix source');
  assert.equal(player.playbackSnapshot.score,replaced?'vict':undefined);
  if(replaced)assert.equal(active.stopped,false,'Stale failure must preserve replacement song');
  else{player.addBuffers({slct:{duration:100}});assert.equal(player.playbackSnapshot.hasSource,false,'Late load must not revive failed exit');}
  player.close();
 }
}
let settings={musicEnabled:true,soundEnabled:true,paused:false};
const original={
 fadeTicks:128,
 get settings(){return settings;},
 control(operation){
  if(operation==='pause-audio')settings={...settings,paused:true};
  if(operation==='resume-audio')settings={...settings,paused:false};
  if(operation==='toggle-music')settings={...settings,musicEnabled:!settings.musicEnabled};
  if(operation==='toggle-sound')settings={...settings,soundEnabled:!settings.soundEnabled};
  return operation==='toggle-music'?Number(settings.musicEnabled):operation==='toggle-sound'?Number(settings.soundEnabled):0;
 },
 setOutputMuted(muted,at=context.currentTime,fade=0){output.push({muted,at,fade});},
 play(name){if(settings.musicEnabled)originalPlays.push(name);},async fadeOut(){},stop(){},close(){},
};
const buffers={titl:{duration:59.64},slct:{duration:61.944},vict:{duration:59.904},over:{duration:58.8}};
const music=createSynchronizedRemixedMusic(context,original,buffers,false);

music.play('titl');
assert.equal(context.gains[0].gain.value,0,'Original mode must keep the prepared Suno source silent');
assert.equal(context.starts.length,1);
assert.equal(context.starts[0].at,10.015);
assert.equal(context.starts[0].offset,remixedMusicTiming.titl.cueOffset);
assert.equal(context.starts[0].rate,1,'the remix must keep its natural speed and pitch');
assert.equal(context.starts[0].loopStart,remixedMusicTiming.titl.cueOffset);
assert.equal(context.starts[0].loopEnd-context.starts[0].loopStart,remixedMusicTiming.titl.loopDuration);

context.currentTime=25;
music.setEnabled(true);
assert.equal(context.gains[0].gain.value,1,'Updated mode enables the actual remix output');
music.setEnabled(false);
assert.equal(context.gains[0].gain.value,0,'Returning to Original mutes Suno without replacing the original driver');
assert.equal(context.starts.length,1,'audio-mode switching must not restart the score');
assert.deepEqual(output.slice(-2).map(event=>event.muted),[true,false]);

context.currentTime=30;
music.control('pause-audio');
assert.equal(context.starts[0].source.stopped,true);
context.currentTime=35;
music.control('resume-audio');
assert.equal(context.starts.length,2);
assert.equal(context.starts[1].at,35.015);
assert.ok(Math.abs(context.starts[1].offset-(remixedMusicTiming.titl.cueOffset+19.985))<1e-9,'resume must retain the calibrated shared score position');

for(const name of ['slct','vict','over']){
 context.currentTime+=5;
 music.play(name);
 const start=context.starts.at(-1);
 assert.equal(start.rate,1,`${name} must keep its natural speed and pitch`);
 assert.equal(start.offset,remixedMusicTiming[name].cueOffset,`${name} must skip only its measured lead-in`);
 assert.equal(start.loopEnd-start.loopStart,remixedMusicTiming[name].loopDuration,`${name} must use the original score loop duration`);
}
const startsBeforeSwitch=context.starts.length;
music.setEnabled(true);
assert.equal(context.starts.length,startsBeforeSwitch,'switching every score must remain gain-only');

const activeSource=context.starts.at(-1).source;
const playsBeforeOptions=originalPlays.length;
context.currentTime+=3;
assert.equal(music.control('toggle-music'),0,'the in-game Options toggle must disable music');
assert.equal(activeSource.stopped,true,'disabling music must stop the remixed score');
assert.equal(context.starts.length,startsBeforeSwitch,'disabling music must not start another source');
music.setEnabled(false);
music.setEnabled(true);
assert.equal(context.starts.length,startsBeforeSwitch,'the website version switch must stay silent while in-game music is disabled');

context.currentTime+=2;
assert.equal(music.control('toggle-music'),1,'the in-game Options toggle must re-enable music');
assert.equal(originalPlays.length,playsBeforeOptions+1,'re-enabling must restart the remembered original score');
assert.equal(originalPlays.at(-1),'over');
assert.equal(context.starts.length,startsBeforeSwitch+1,'re-enabling must restart the matching remixed score');
assert.equal(context.starts.at(-1).offset,remixedMusicTiming.over.cueOffset,'both versions must restart from the same score boundary');

const startsBeforeSoundToggle=context.starts.length;
assert.equal(music.control('toggle-sound'),0,'sound effects must remain an independent in-game setting');
assert.equal(context.starts.length,startsBeforeSoundToggle,'the sound-effects toggle must not restart music');

music.control('toggle-music');
music.play('vict');
assert.equal(context.starts.length,startsBeforeSoundToggle,'a score requested while music is disabled must remain silent');
music.control('pause-audio');
music.control('resume-audio');
assert.equal(context.starts.length,startsBeforeSoundToggle,'leaving another Options dialog must not resume disabled music');
context.currentTime+=1;
music.control('toggle-music');
assert.equal(originalPlays.at(-1),'vict','re-enabling must use the most recently requested score');
assert.equal(context.starts.at(-1).offset,remixedMusicTiming.vict.cueOffset);

console.log('remixed music synchronization checks passed');

const delayedContext=new Context(),delayedOutput=[],delayedPlays=[];
let delayedSettings={musicEnabled:true,soundEnabled:true,paused:false};
const delayedOriginal={
 fadeTicks:128,get settings(){return delayedSettings;},
 control(operation){if(operation==='pause-audio')delayedSettings={...delayedSettings,paused:true};if(operation==='resume-audio')delayedSettings={...delayedSettings,paused:false};return 0;},
 setOutputMuted(muted,at=delayedContext.currentTime,fade=0){delayedOutput.push({muted,at,fade});},
 play(name){delayedPlays.push(name);},async fadeOut(){},stop(){},close(){},
};
const delayed=createSynchronizedRemixedMusic(delayedContext,delayedOriginal,{},true);
delayed.play('slct');
assert.equal(delayedContext.starts.length,0,'a score that is still downloading must not delay playback');
assert.equal(delayedOutput.at(-1).muted,true,'Updated mode must keep original device silent while its remix downloads');
delayedContext.currentTime=22;
delayed.addBuffers({slct:buffers.slct});
assert.equal(delayedContext.starts.length,1,'a downloaded remix must join the score already in progress');
assert.ok(Math.abs(delayedContext.starts[0].offset-(remixedMusicTiming.slct.cueOffset+12))<1e-9,'late loading must use the score position at the scheduled start, including scheduling lead');
assert.equal(delayedOutput.at(-1).muted,true,'Original stays muted when the remix joins its running score');

for(const asynchronous of [false,true]){
 const titleContext=new Context(),muting=[];
 const titleOriginal={...delayedOriginal,setOutputMuted(muted){muting.push(muted);}};
 const title=createSynchronizedRemixedMusic(titleContext,titleOriginal,{},true);
 if(asynchronous)await title.playAsync('titl');else title.play('titl');
 assert.ok(muting.length>0&&muting.every(Boolean),'Delayed Updated title never unmutes original Tandy/device output');
 titleContext.currentTime=0.5;title.addBuffers({titl:buffers.titl});
 assert.equal(titleContext.starts.length,1);assert.ok(muting.every(Boolean));
 title.setEnabled(false);assert.equal(muting.at(-1),false,'Explicit Original selection remains audible');title.close();
}
for(const score of ['titl','slct','vict','over']){
 const pendingContext=new Context(),muting=[];let state={musicEnabled:true,soundEnabled:true,paused:false};
 const pendingOriginal={...delayedOriginal,get settings(){return state;},
  setOutputMuted(muted){muting.push(muted);},
  control(operation){if(operation==='pause-audio')state={...state,paused:true};if(operation==='resume-audio')state={...state,paused:false};return 0;}};
 const pending=createSynchronizedRemixedMusic(pendingContext,pendingOriginal,{},true);
 pending.play(score);pending.control('pause-audio');pending.control('resume-audio');
 assert.ok(muting.every(Boolean),'Missing remix cannot leak original after pause/resume');
 pending.setEnabled(false);assert.equal(muting.at(-1),false);
 pending.setEnabled(true);assert.equal(muting.at(-1),true,'Enabling Updated while still loading must mute original immediately');
 pending.addBuffers({[score]:buffers[score]});assert.equal(muting.at(-1),true);assert.equal(pendingContext.starts.length,1);pending.close();
}

const switchedContext=new Context();
const switched=createSynchronizedRemixedMusic(switchedContext,delayedOriginal,{},false);
switched.play('slct');
switchedContext.currentTime=22;
switched.addBuffers({slct:buffers.slct});
assert.equal(switchedContext.starts.length,0,'inactive remix must not start when its buffer arrives');
switched.setEnabled(true);
assert.ok(Math.abs(switchedContext.starts[0].offset-(remixedMusicTiming.slct.cueOffset+12))<1e-9,'enabling a newly loaded remix must align at its future scheduled start');

const asyncContext=new Context();let asyncSettings={musicEnabled:true,soundEnabled:true,paused:false};
let releaseControl=()=>{},enteredControl=()=>{};const operations=[];
const asyncOriginal={...original,get settings(){return asyncSettings;},
 control(){assert.fail('Async host must not use immediate controls');},
 async controlAsync(operation){
  operations.push(operation);enteredControl();await new Promise(resolve=>{releaseControl=resolve;});
  if(operation==='pause-audio')asyncSettings={...asyncSettings,paused:true};
  if(operation==='resume-audio')asyncSettings={...asyncSettings,paused:false};return 0;
 },
};
const awaited=createSynchronizedRemixedMusic(asyncContext,asyncOriginal,buffers,true);
awaited.play('slct');
let reached=new Promise(resolve=>{enteredControl=resolve;});
const pause=awaited.controlAsync('pause-audio');await reached;
assert.equal(asyncContext.starts[0].source.stopped,true);
releaseControl();await pause;
reached=new Promise(resolve=>{enteredControl=resolve;});
const resume=awaited.controlAsync('resume-audio');await reached;
assert.equal(asyncContext.starts.length,1,'Remix must not resume ahead of original transport');
asyncContext.currentTime=20;releaseControl();await resume;
assert.equal(asyncContext.starts.length,2);assert.equal(asyncContext.starts[1].at,20.015);
reached=new Promise(resolve=>{enteredControl=resolve;});
const late=awaited.controlAsync('pause-audio');const rejected=assert.rejects(late,{name:'AbortError'});
await reached;awaited.stop();releaseControl();await rejected;
assert.equal(asyncContext.starts.length,2,'Stop cannot be undone by late control completion');
assert.deepEqual(operations,['pause-audio','resume-audio','pause-audio']);awaited.close();
console.log('Awaited remix controls wait for original delivery and cannot revive stopped playback');

const startContext=new Context();let releaseStart=()=>{},enteredStart=()=>{};
const startOriginal={...delayedOriginal,
 play(){assert.fail('Awaited start must use asynchronous original');},
 async playAsync(){enteredStart();await new Promise(resolve=>{releaseStart=resolve;});},
};
const startMusic=createSynchronizedRemixedMusic(startContext,startOriginal,buffers,true);
let startReached=new Promise(resolve=>{enteredStart=resolve;});
const firstStart=startMusic.playAsync('slct');await startReached;
assert.equal(startContext.starts.length,0,'Remix cannot start ahead of original startup');
startMusic.setEnabled(false);startMusic.setEnabled(true);startMusic.addBuffers({slct:buffers.slct});
assert.equal(startContext.starts.length,0,'Mode changes and buffer arrival cannot bypass pending startup');
startContext.currentTime=30;releaseStart();await firstStart;
assert.equal(startContext.starts.length,1);assert.equal(startContext.starts[0].at,30.015);
startReached=new Promise(resolve=>{enteredStart=resolve;});
const lateStart=startMusic.playAsync('titl');const cancelledStart=assert.rejects(lateStart,{name:'AbortError'});
await startReached;startMusic.stop();releaseStart();await cancelledStart;
assert.equal(startContext.starts.length,1,'Late original startup cannot revive remix after stop');
startMusic.close();
console.log('Awaited score starts align remix to original completion and cannot revive stopped playback');

for(const scheduledFade of [false,true]){
 const fadingContext=new Context();let enter,release;
 const reached=new Promise(resolve=>{enter=resolve;});
 const fadingOriginal={...delayedOriginal,async playAsync(){enter();await new Promise(resolve=>{release=resolve;});},async fadeOutObserved(_wait,observer){observer.stopped();}};
 const fadingMusic=createSynchronizedRemixedMusic(fadingContext,fadingOriginal,buffers,true,remixedMusicTiming,{scheduledFade});
 const pending=fadingMusic.playAsync('slct');
 await reached;await fadingMusic.fadeOut(async()=>{});
 const rejected=assert.rejects(pending,{name:'AbortError'});release();await rejected;
 assert.equal(fadingContext.starts.length,0,'Completed menu fade must not be undone by late score startup');
 assert.equal(fadingMusic.playbackSnapshot.score,undefined);assert.equal(fadingMusic.playbackSnapshot.starting,false);
 fadingMusic.close();
 console.log(`${scheduledFade?'Delivered':'Nominal'} menu fade supersedes pending remix startup without reviving a source`);
}

const restartContext=new Context();let restartSettings={musicEnabled:true,soundEnabled:true,paused:false};
let enteredRestart=()=>{},releaseRestart=()=>{},restartCount=0;
const restartOriginal={...original,get settings(){return restartSettings;},
 control(){assert.fail('Timed restart must not use synchronous control');},
 async controlAsync(operation){assert.equal(operation,'toggle-music');restartSettings={...restartSettings,musicEnabled:!restartSettings.musicEnabled};return Number(restartSettings.musicEnabled);},
 async playAsync(name){assert.equal(name,'slct');restartCount++;enteredRestart();await new Promise(resolve=>{releaseRestart=resolve;});},
};
const restartMusic=createSynchronizedRemixedMusic(restartContext,restartOriginal,buffers,true);
restartMusic.play('slct');await restartMusic.controlAsync('toggle-music');
const restartReached=new Promise(resolve=>{enteredRestart=resolve;});
const restart=restartMusic.controlAsync('toggle-music');await restartReached;
restartMusic.addBuffers({slct:buffers.slct});restartMusic.setEnabled(false);restartMusic.setEnabled(true);
assert.equal(restartContext.starts.length,1,'Restart must wait before scheduling remix');
restartContext.currentTime=40;releaseRestart();await restart;
assert.equal(restartCount,1);assert.equal(restartContext.starts.length,2);assert.equal(restartContext.starts[1].at,40.015);
await restartMusic.controlAsync('toggle-music');
const stopRestartReached=new Promise(resolve=>{enteredRestart=resolve;});
const stopRestart=restartMusic.controlAsync('toggle-music');const stopRestartRejected=assert.rejects(stopRestart,{name:'AbortError'});
await stopRestartReached;restartMusic.stop();releaseRestart();await stopRestartRejected;
assert.equal(restartContext.starts.length,2,'Stop cancels late toggle-on restart');restartMusic.close();
console.log('Timed toggle-on restarts wait for original startup, resist early mode/buffer changes, and honor Stop');
const anchoredContext=new Context();
const anchoredOriginal={...delayedOriginal,playbackStartAt:9.8,async playAsync(){}};
const anchored=createSynchronizedRemixedMusic(anchoredContext,anchoredOriginal,buffers,true);
await anchored.playAsync('slct');
assert.ok(Math.abs(anchoredContext.starts[0].offset-(remixedMusicTiming.slct.cueOffset+.215))<1e-9,'Remix catches up to actual scheduled original buffer, not startup completion');
anchored.close();
console.log('Timed remix startup uses actual original Web Audio anchor instead of introducing startup completion lag');
const calibratedContext=new Context(),calibration=structuredClone(remixedMusicTiming);
calibration.slct={cueOffset:.125,loopDuration:17};
const calibrated=createSynchronizedRemixedMusic(calibratedContext,delayedOriginal,buffers,true,calibration);
calibration.slct.cueOffset=9;calibration.slct.loopDuration=2;
calibrated.play('slct');assert.equal(calibratedContext.starts[0].offset,.125);
assert.equal(calibratedContext.starts[0].loopStart,.125);assert.equal(calibratedContext.starts[0].loopEnd,17.125);
assert.equal(remixedMusicTiming.slct.cueOffset,.85,'Separate calibration cannot mutate legacy timing');
calibrated.close();
const lateBuffers={};Object.defineProperty(lateBuffers,'slct',{enumerable:true,get(){assert.fail('Closed music must ignore late decoded buffers before reading or retaining them');}});
calibrated.addBuffers(lateBuffers);assert.equal(calibratedContext.starts.length,1,'Late decode cannot restart closed player');
assert.equal(buffers.slct.duration,61.944,'Closing player cannot mutate caller-owned buffers');
assert.throws(()=>createSynchronizedRemixedMusic(new Context(),delayedOriginal,buffers,false,{...remixedMusicTiming,slct:{cueOffset:0,loopDuration:NaN}}),/Invalid remixed timing/);
console.log('Explicit calibration is snapshotted, validates finite timing and leaves legacy profile unchanged; fixture values are not 1991 calibration');
const introContext=new Context(),introProfile=structuredClone(remixedMusicTiming);
introProfile.slct={cueOffset:.25,introDuration:2,loopDuration:10};
const intro=createSynchronizedRemixedMusic(introContext,delayedOriginal,buffers,true,introProfile);
introProfile.slct.introDuration=20;
intro.play('slct');
assert.equal(introContext.starts[0].offset,.25);
assert.equal(introContext.starts[0].loopStart,2.25);
assert.equal(introContext.starts[0].loopEnd,12.25);
introContext.currentTime=11;
intro.setEnabled(false);intro.setEnabled(true);
assert.equal(introContext.starts.length,1,'Mode switching keeps the original source and intro clock running');
intro.control('pause-audio');intro.control('resume-audio');
assert.ok(Math.abs(introContext.starts.at(-1).offset-1.235)<1e-9,'Resume during intro retains its position');
introContext.currentTime=35;
intro.control('pause-audio');intro.control('resume-audio');
assert.ok(Math.abs(introContext.starts.at(-1).offset-5.22)<1e-9,'Multiple repeats must never replay the one-time intro');
intro.close();
for(const introDuration of [-1,NaN,Infinity])assert.throws(()=>createSynchronizedRemixedMusic(new Context(),delayedOriginal,buffers,false,{...remixedMusicTiming,slct:{cueOffset:0,loopDuration:1,introDuration}}),/Invalid remixed timing/);
console.log('Optional one-time intro has separate repeat region, survives mode changes and leaves default profiles unchanged');
for(const [decodeAt,expectedOffset] of [[11,1.25],[35,5.25],[22,2.25]]){
 const lateIntroContext=new Context();
 const profile={...remixedMusicTiming,slct:{cueOffset:.25,introDuration:2,loopDuration:10}};
 const lateIntro=createSynchronizedRemixedMusic(lateIntroContext,delayedOriginal,{},true,profile);
 lateIntro.play('slct');lateIntroContext.currentTime=decodeAt;lateIntro.addBuffers(buffers);
 assert.ok(Math.abs(lateIntroContext.starts[0].offset-expectedOffset)<1e-9,`Late decode at ${decodeAt} must enter the correct intro/repeat position`);
 lateIntro.close();
}
console.log('Delayed remix decoding joins the one-time intro, steady repeats, and exact loop boundary without restarting');
// Current actual-Suno timing profile, mocked buffers only; no listening claim.
const sunoTiming=browserMs91SunoScorePreview('ms-1991',{hostname:'localhost',search:'?preview-suno-score=1'}).timing;
for(const [name,{introDuration:firstTraversal,loopDuration:steadyTraversal}] of Object.entries(sunoTiming))
for(const elapsed of [4,firstTraversal-.1,firstTraversal+.1,firstTraversal+steadyTraversal+.1,firstTraversal+3*steadyTraversal+7]){
 const longContext=new Context();
 const profile={...remixedMusicTiming,[name]:{cueOffset:0,introDuration:firstTraversal,loopDuration:steadyTraversal}};
 const player=createSynchronizedRemixedMusic(longContext,delayedOriginal,{},true,profile);
 player.play(name);longContext.currentTime=10+elapsed;
 player.addBuffers({[name]:{duration:firstTraversal+2*steadyTraversal}});
 const expected=elapsed<firstTraversal?elapsed:firstTraversal+(elapsed-firstTraversal)%steadyTraversal;
 assert.ok(Math.abs(longContext.starts[0].offset-expected)<1e-9);
 assert.equal(longContext.starts[0].loopStart,firstTraversal);
 assert.equal(longContext.starts[0].loopEnd,firstTraversal+steadyTraversal);
 const snapshot=player.playbackSnapshot;
 assert.equal(snapshot.score,name);assert.equal(snapshot.hasSource,true);
 assert.equal(snapshot.loopStart,firstTraversal);assert.equal(snapshot.loopEnd,firstTraversal+steadyTraversal);
 snapshot.score='unrelated';snapshot.hasSource=false;
 assert.equal(player.playbackSnapshot.score,name,'Diagnostic snapshot cannot mutate playback');
 assert.equal(player.playbackSnapshot.hasSource,true);
 const count=longContext.starts.length;
 player.setEnabled(false);player.setEnabled(true);
 assert.equal(longContext.starts.length,count,'Mode switches cannot restart a long first traversal');
 player.control('pause-audio');player.control('resume-audio');
 assert.ok(longContext.starts.at(-1).offset>=firstTraversal||elapsed<firstTraversal,'Repeats never revisit opening');
 player.close();
 assert.equal(player.playbackSnapshot.hasSource,false,'Closed sources are not reported active');
}
console.log('Actual-Suno timing profile retains first traversal/repeated position through late decode and mode switches; mocked buffers, not listening approval');
