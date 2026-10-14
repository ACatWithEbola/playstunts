import assert from 'node:assert/strict';
import {executeTimedMt32Program,type TimedMt32Host} from '../lib/game/timed-mt32-program.ts';
import {delayMs91Mt32Pit} from '../lib/game/mt32-pit-delay.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
const events:string[]=[];let release:(value:number)=>void=()=>{};
const host:TimedMt32Host={read(port){events.push('read:'+port);return port===0x42?new Promise<number>(resolve=>{release=resolve;}):0;},write(port,value){events.push(`write:${port}:${value}`);},interrupts(){},delay(){},cancelled:()=>false};
const pending=executeTimedMt32Program(delayMs91Mt32Pit(400),host);
for(let i=0;i<20;i++)await Promise.resolve();
assert.equal(events.at(-1),'read:66');const size=events.length;
await Promise.resolve();assert.equal(events.length,size,'Transport must wait for counter response');
release(0);for(let i=0;i<5;i++)await Promise.resolve();release(0);
assert.equal(await pending,0);assert.equal(events.at(-1),'write:97:0');
let cancelled=false;
await assert.rejects(executeTimedMt32Program(delayMs91Mt32Pit(400),{...host,read(){cancelled=true;return 0;},cancelled:()=>cancelled}),{name:'AbortError'});
await assert.rejects(executeTimedMt32Program(delayMs91Mt32Pit(400),{...host,read:()=>256}),/Invalid Roland port response/);
console.log('Explicit timed Roland runner waits for reads, preserves ordering, rejects invalid values and honours cancellation');
for(const cancel of [false,true]){
 let stopped=false,finalized=false,yields=0;const actual:number[]=[];
 function* longTransfer():OriginalMt32MpuProgram{try{for(let index=0;index<5000;index++)yield {kind:'write',port:0x330,value:index&255};return 0;}finally{finalized=true;}}
 const transfer=executeTimedMt32Program(longTransfer(),{...host,cancelled:()=>stopped,write(_,value){actual.push(value);},async yieldTask(){yields++;assert.equal(actual.length,4096);if(cancel)stopped=true;}});
 if(cancel)await assert.rejects(transfer,{name:'AbortError'});else assert.equal(await transfer,0);
 assert.equal(yields,1);assert.equal(finalized,true);
 assert.deepEqual(actual,Array.from({length:cancel?4096:5000},(_,index)=>index&255),'Responsiveness yield preserves every completed byte and ordering');
}
console.log('Long timed Roland transfers yield through owning host, retain byte order, and stop after cancellation without later writes');
// Device/clock failures must unwind the original program without delivering
// any later command, even when the owning host rejects asynchronously.
for(const boundary of ['read','write','interrupts','delay'] as const){
 let finalized=false,laterWrites=0;
 const failure=new Error('Owning host failed: '+boundary);
 function* failingTransfer():OriginalMt32MpuProgram{
  try{
   if(boundary==='read')yield {kind:'read',port:0x331};
   else if(boundary==='write')yield {kind:'write',port:0x330,value:1};
   else if(boundary==='interrupts')yield {kind:'interrupts',enabled:false};
   else yield {kind:'delay',loop:'decrement-dx',iterations:65536};
   yield {kind:'write',port:0x330,value:2};return 0;
  }finally{finalized=true;}
 }
 const failingHost:TimedMt32Host={
  read:async()=>{throw failure;},
  write:async(_,value)=>{if(value===2)laterWrites++;throw failure;},
  interrupts:async()=>{throw failure;},delay:async()=>{throw failure;},
  cancelled:()=>false,
 };
 await assert.rejects(executeTimedMt32Program(failingTransfer(),failingHost),error=>error===failure);
 assert.equal(finalized,true,boundary+' failure must release the program');
 assert.equal(laterWrites,0,boundary+' failure must not deliver later MIDI');
}
console.log('Asynchronous device and clock failures finalize all timed Roland boundaries without later MIDI writes');
