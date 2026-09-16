import assert from 'node:assert/strict';
import {scrubNativeReplay} from '../lib/game/native-replay-scrub.ts';

const d=0,memory=new Uint8Array(0xb000),view=new DataView(memory.buffer);
const word=offset=>view.getUint16(offset,true),write=(offset,value)=>view.setUint16(offset,value,true);
write(0x73b2,10);write(0x8c26,10);write(0x8fd8,20);memory[0x9ad4]=0x10;
let prepared=false,counterCalls=0;
const animationDelays=[];
await scrubNativeReplay({
 memory:()=>memory,
 pauseAudio(){},
 control(){},
 counter(){counterCalls++;return counterCalls===1?0:100;},
 async input(delay){
  if(!prepared)memory[0x9ad4]=0;
  else animationDelays.push(delay);
  return 0;
 },
 prepareSeek(){prepared=true;write(0x8c26,10);},
 simulate(){write(0x8c26,word(0x8c26)+1);},
 waitMessage(){},
},d,'forward');

assert.equal(word(0x8c26),20,'fast-forward must simulate to the selected replay frame');
assert.deepEqual(animationDelays,[1,1,1,1,1,1,1,1,1,1,1000],
 'fast-forward must yield each intermediate marker position before the final wait');

console.log('Replay scrub animation checks passed.');
