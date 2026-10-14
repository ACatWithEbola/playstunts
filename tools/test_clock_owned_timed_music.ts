import assert from 'node:assert/strict';
import {createClockOwnedTimedMusic} from '../lib/game/clock-owned-timed-music.ts';
import {createRetainedMenuClockOwner} from '../lib/game/retained-menu-clock-owner.ts';
let wall=0,settings={paused:false,musicEnabled:true,soundEnabled:true},fail=false,hasScore=false;
const clock=createRetainedMenuClockOwner({callbackCounter:0,gameCounter:0,divisor:5,countdown:5},()=>wall);
const player={get settings(){return {...settings};},get hasScore(){return hasScore;},get failure(){return undefined;},get playbackStartAt(){return 12;},
 async playAsync(){assert.equal(clock.source,'audio');hasScore=settings.musicEnabled;if(hasScore)clock.audioTick();if(fail){hasScore=false;throw Error('Startup failed');}},
 async controlAsync(operation:string){if(operation==='pause-audio')settings.paused=true;if(operation==='resume-audio')settings.paused=false;if(operation==='toggle-music')settings.musicEnabled=!settings.musicEnabled;return Number(settings.musicEnabled);},
 async stopAsync(){hasScore=false;},async closeAsync(){hasScore=false;},close(){hasScore=false;},async fadeOut(){hasScore=false;},
};
const owned=createClockOwnedTimedMusic(player as any,clock);
await owned.playAsync('titl');assert.equal(clock.source,'audio');wall=100;clock.audioTick();assert.equal(clock.inputClock.counter(),2);
await owned.controlAsync('pause-audio');assert.equal(clock.source,'wall');wall=107;assert.equal(clock.inputClock.counter(),9);
await owned.controlAsync('resume-audio');assert.equal(clock.source,'audio');wall=200;clock.audioTick();assert.equal(clock.inputClock.counter(),10);
await owned.stopAsync();assert.equal(clock.source,'wall');wall=205;assert.equal(clock.inputClock.counter(),15);
await owned.controlAsync('toggle-music');await owned.playAsync('slct');assert.equal(clock.source,'wall','Disabled startup must not leave menu clock stalled');
assert.equal(owned.settings.musicEnabled,false);assert.equal(owned.playbackStartAt,12);
await owned.controlAsync('toggle-music');assert.equal(clock.source,'wall','Enable without an active song must not stall menu time');
await owned.playAsync('slct');assert.equal(clock.source,'audio','Actual restarted song takes audio ownership');
settings.musicEnabled=true;fail=true;await assert.rejects(owned.playAsync('vict'),/Startup failed/);assert.equal(clock.source,'wall');
await owned.closeAsync();assert.equal(clock.source,'wall');
assert.throws(()=>owned.stop(),/stopAsync/);
clock.takeAudioOwnership();await owned.fadeOut(async()=>{});assert.equal(clock.source,'wall');
clock.takeAudioOwnership();owned.close();assert.equal(clock.source,'wall');
console.log('Explicit timed music bridge hands menu clock back on pause, disabled startup, stop, close and startup failure without double-counting wall time');

let rejectOld:(error:Error)=>void=()=>{},finishStop:()=>void=()=>{};
const overlapping={...player,get hasScore(){return true;},get settings(){return {paused:false,musicEnabled:true,soundEnabled:true};},
 async playAsync(name:string){if(name==='titl')await new Promise<void>((_resolve,reject)=>{rejectOld=reject;});},
 async stopAsync(){await new Promise<void>(resolve=>{finishStop=resolve;});},
};
const shared=createClockOwnedTimedMusic(overlapping as any,clock);
const older=shared.playAsync('titl'),rejected=assert.rejects(older,/Superseded/);
await shared.playAsync('slct');rejectOld(new Error('Superseded'));await rejected;
assert.equal(clock.source,'audio','Cancelled older startup cannot take clock from newer song');
const oldStop=shared.stopAsync();await shared.playAsync('vict');finishStop();await oldStop;
assert.equal(clock.source,'audio','Older stop completion cannot take clock from newer song');
clock.audioTick();shared.close();

// The continuous Original path has the same ownership rules, even when a
// host wait fails or an old completion arrives after a replacement starts.
for(const mode of ['complete','failure','superseded']){
 let finish!:()=>void,reject!: (error:Error)=>void;
 const continuous={...player,get hasScore(){return true;},get settings(){return {paused:false,musicEnabled:true,soundEnabled:true};},
  async playAsync(){},
  async fadeOutContinuous(_wait:unknown,stopped:()=>void){await new Promise<void>((resolve,fail)=>{finish=resolve;reject=fail;});stopped();},
 };
 const owner=createClockOwnedTimedMusic(continuous as any,clock);
 clock.takeAudioOwnership();const pending=owner.fadeOutContinuous(async()=>{});
 assert.equal(clock.source,'audio','Pending continuous fade retains the audio clock');
 if(mode==='failure'){
  const rejected=assert.rejects(pending,/Host wait failed/);reject(Error('Host wait failed'));await rejected;
  assert.equal(clock.source,'wall','Failure restores menu time');
 }else{
  if(mode==='superseded')await owner.playAsync('vict');
  finish();await pending;
  assert.equal(clock.source,mode==='superseded'?'audio':'wall','An old fade cannot take the replacement clock');
 }
 owner.close();
}
console.log('Continuous Original fade hands back clock on completion/failure but cannot steal ownership from a newer score');

// The original Roland fade waits another 50 ticks AFTER stopping its stream.
// Keeping audio ownership until fadeOut returns would deadlock that wait.
const fading={...player,async fadeOut(wait:(ticks:number)=>Promise<void>,stopped?:()=>void){
 assert.equal(clock.source,'audio');clock.audioTick();stopped?.();
 assert.equal(clock.source,'wall');await wait(50);hasScore=false;
}};
const fadeOwned=createClockOwnedTimedMusic(fading as any,clock);
clock.takeAudioOwnership();const beforeFade=clock.inputClock.counter();
await fadeOwned.fadeOut(async ticks=>{wall+=ticks;assert.equal(clock.inputClock.counter(),beforeFade+1+ticks);});
assert.equal(clock.source,'wall');
console.log('Roland fade hands the stopped stream clock to wall time before its original final 50-tick delay');
