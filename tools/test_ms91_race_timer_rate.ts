import assert from 'node:assert/strict';
import {tickOriginalRaceTimer} from '../lib/game/native-race-timer.ts';
import {tickOriginalRaceAudioTimer} from '../lib/game/native-race-audio-timer.ts';
function run(fps?:10|20){
 const memory=new Uint8Array(65536),view=new DataView(memory.buffer);
 memory[0x90a0]=1;memory[0xa3c2]=1;view.setUint16(0x8ffc,1,true);
 let captures=0;const samples:number[]=[];
 const host={memory:()=>memory,stackMatches:()=>true,audioSample:(_record:number,interval:number)=>samples.push(interval),pauseAudio:()=>{throw Error('Unexpected replay transition');},capture:()=>{captures++;}};
 for(let tick=0;tick<10;tick++)tickOriginalRaceTimer(host,0,fps);
 return {memory,captures,samples};
}
assert.deepEqual(run(),run(20));
assert.equal(run(20).captures,2);
assert.equal(run(10).captures,1);
assert.deepEqual(run(20).samples,[5]);
assert.deepEqual(run(10).samples,[10]);
assert.equal(run(10).memory[0x8936],0,'Timer reentrancy guard must be released');
console.log('MS91 race timer uses 100/rate intervals and preserves default 20 Hz');
function audioRun(fps?:10|20){
 const memory=new Uint8Array(65536),view=new DataView(memory.buffer);
 memory[0x90a0]=1;memory[0xa3c2]=1;
 let captures=0,ticks=0;
 const host={memory:()=>memory,stackMatches:()=>true,pauseAudio(){throw Error('Unexpected pause');},capture(){captures++;}};
 const audio={tick(){ticks++;return [[ticks]];},update(){throw Error('No queued audio expected');}};
 const writes=[];
 for(let tick=0;tick<10;tick++)writes.push(tickOriginalRaceAudioTimer(host,0,audio,fps));
 return {memory,captures,ticks,writes};
}
assert.deepEqual(audioRun(),audioRun(20));
assert.equal(audioRun(10).captures,1);assert.equal(audioRun(20).captures,2);
assert.equal(audioRun(10).ticks,10,'Hardware audio callbacks retain their own tick frequency');
console.log('Audio timer wrapper propagates recording cadence without slowing hardware callbacks');
