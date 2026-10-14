import assert from 'node:assert/strict';
import {finishNativeRace} from '../lib/game/native-race-exit.ts';
const d=0x2d1a0,memory=new Uint8Array(0x100000),events:string[]=[];
let pauseEntered:()=>void=()=>{},pauseDone:()=>void=()=>{},timerEntered:()=>void=()=>{},timerDone:()=>void=()=>{},freeEntered:()=>void=()=>{},freeDone:()=>void=()=>{};
const paused=new Promise<void>(resolve=>{pauseEntered=resolve;}),timer=new Promise<void>(resolve=>{timerEntered=resolve;}),free=new Promise<void>(resolve=>{freeEntered=resolve;});
const host={memory:()=>memory,hasAlternateBuffer:()=>false,hideMouse(){},showMouse(){},selectBackBuffer(){},selectFrontBuffer(){},clearScreen(){},copyBackBuffer(){events.push('copy');},async pauseAudio(){pauseEntered();await new Promise<void>(resolve=>{pauseDone=resolve;});events.push('paused');},async removeAudioTimer(){timerEntered();await new Promise<void>(resolve=>{timerDone=resolve;});events.push('audio-removed');},async waitForOpponent(){events.push('opponent');},resetMouse(){events.push('mouse');},async removeFrameCallback(){events.push('frame-removed');},async freeCars(){freeEntered();await new Promise<void>(resolve=>{freeDone=resolve;});events.push('freed');},async releaseInput(){events.push('input');},showWaiting(){events.push('waiting');}};
const exit=finishNativeRace(host,d);await paused;assert.deepEqual(events,['copy']);assert.equal(memory[d+0x9aca],1);pauseDone();await timer;assert.deepEqual(events,['copy','paused']);timerDone();await free;
assert.ok(!events.includes('input'),'Resource cleanup must finish before restoring input/waiting');freeDone();await exit;
assert.deepEqual(events,['copy','paused','audio-removed','opponent','mouse','frame-removed','freed','input','waiting']);
for(const fail of ['pauseAudio','removeAudioTimer','freeCars'] as const){
 const calls:string[]=[];
 const immediate={...host,pauseAudio(){calls.push('pauseAudio');},removeAudioTimer(){calls.push('removeAudioTimer');},freeCars(){calls.push('freeCars');},async releaseInput(){calls.push('input');},showWaiting(){calls.push('waiting');}};
 await assert.rejects(finishNativeRace({...immediate,[fail]:async()=>{throw Error(fail);}},d),new RegExp(fail));
 assert.ok(!calls.includes('input')&&!calls.includes('waiting'),'Failed async shutdown must not claim menu readiness');
}
console.log('Race exit awaits pause, audio-timer removal and resource release in original order; failures prevent false menu readiness');
