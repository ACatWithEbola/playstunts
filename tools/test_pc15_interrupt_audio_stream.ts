import assert from 'node:assert/strict';
import {createPc15InterruptAudioStream} from '../lib/game/pc15-interrupt-audio-stream.ts';
import {createOriginalPcSpeakerToneStream} from '../lib/game/pc-speaker-audio.ts';
import {PC_PIT_INPUT_HZ,ORIGINAL_PIT_DIVISOR} from '../lib/game/timer-interrupt.ts';
const initial=[[0x42,100],[0x42,0],[0x61,3]];
for(const rate of [44100,48000]){
 let a=0,b=0;
 const old=createOriginalPcSpeakerToneStream({tick(){a++;return [[0x42,(a%100)+50],[0x42,0]];}},initial,rate);
 const current=createPc15InterruptAudioStream({interrupt(){b++;return [[0x42,(b%100)+50],[0x42,0]];}},initial,rate);
 assert.deepEqual(current.render(4096),old.render(4096));assert.equal(a,b);
}
let count=0;
const stream=createPc15InterruptAudioStream({interrupt(){count++;return count===1?[[0x43,0x36],[0x40,ORIGINAL_PIT_DIVISOR&255],[0x40,ORIGINAL_PIT_DIVISOR>>8]]:[];}},[[0x43,0x36],[0x40,70],[0x40,0]],44100);
stream.render(44100);assert.equal(stream.divisor,ORIGINAL_PIT_DIVISOR);assert.equal(count,1+Math.floor((PC_PIT_INPUT_HZ-70)/ORIGINAL_PIT_DIVISOR));
assert.throws(()=>stream.write([[0x43,0x34]]));
function sampleStream(){let ticks=0;return createPc15InterruptAudioStream({interrupt(){ticks++;return [[0x42,5+ticks%60],[0x42,0],[0x61,2],[0x61,3]];}},[[0x43,0x36],[0x40,70],[0x40,0],[0x43,0xb2]],44100);}
const whole=sampleStream(),split=sampleStream(),expected=whole.render(4096),actual=new Float32Array(4096);
for(let at=0;at<4096;){const size=Math.min(137,4096-at);actual.set(split.render(size),at);at+=size;}
assert.deepEqual(actual,expected,'Sample pulse PCM and IRQ phase survive arbitrary buffer partitions');
console.log('IRQ speaker stream matches ordinary tone PCM exactly; sample-to-tone timer restoration delivers correct callback count');
