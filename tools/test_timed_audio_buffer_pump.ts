import assert from 'node:assert/strict';
import {createTimedAudioBufferPump} from '../lib/game/timed-audio-buffer-pump.ts';
let now=0,active=true,renders=0,release:(value:number)=>void=()=>{};
const submitted:{buffer:number;start:number}[]=[];
const pump=createTimedAudioBufferPump({now:()=>now,duration:0.016,active:()=>active,
 render(){renders++;return new Promise<number>(resolve=>{release=resolve;});},
 submit(buffer,start){submitted.push({buffer,start});}});
const first=pump.pump();assert.equal(pump.pump(),first);assert.equal(renders,1);
// An expensive render advances wall time beyond the original batch deadline.
// Schedule its samples in the future, but do not keep chasing that new clock.
now=1;release(7);await Promise.resolve();await Promise.resolve();
assert.equal(renders,2,'New timeline refills its once-anchored startup runway');
now=1.2;release(8);await first;
assert.deepEqual(submitted,[{buffer:7,start:1.015},{buffer:8,start:1.2+.015}]);assert.equal(renders,2,'Second slow render cannot move the fixed batch deadline again');
const second=pump.pump();assert.equal(renders,3);active=false;release(9);await second;
assert.equal(submitted.length,2,'No post-close buffer delivery');
let attempts=0;
const broken=createTimedAudioBufferPump({now:()=>0,duration:0.016,active:()=>true,
 async render(){attempts++;throw Error('Transport lost');},submit(){assert.fail('Failed render must not schedule');}});
await assert.rejects(broken.pump(),/Transport lost/);
await assert.rejects(broken.pump(),/pump failed/);assert.equal(attempts,1);
assert.throws(()=>createTimedAudioBufferPump({now:()=>0,duration:0,active:()=>true,async render(){return 0;},submit(){}}),/duration/);
for(const lookaheadSeconds of [NaN,Infinity,.029,.251])assert.throws(()=>createTimedAudioBufferPump({now:()=>0,duration:.016,lookaheadSeconds,active:()=>true,async render(){return 0;},submit(){}}),/lookahead/);
console.log('Async audio pump coalesces overlapping calls, bounds delayed batches, drops post-close buffers and rejects failed-stream reuse; synthetic clock only');
let clock=0,clockRenders=0,delivered=0;
const backwards=createTimedAudioBufferPump({now:()=>clock,duration:0.016,active:()=>true,
 async render(){clock=++clockRenders===1?0.01:0.005;return 0;},submit(){delivered++;}});
await assert.rejects(backwards.pump(),/Invalid audio clock/);
assert.equal(delivered,1,'A clock regression inside the same batch cannot submit another buffer');
await assert.rejects(backwards.pump(),/pump failed/);
console.log('Browser scheduling rejects intra-batch clock regression and prevents failed-timeline reuse');
let continuityClock=0,continuityRenders=0;const starts:number[]=[];
const continuous=createTimedAudioBufferPump({now:()=>continuityClock,duration:.016,active:()=>starts.length<2,
 async render(){if(++continuityRenders===2)continuityClock=.02;return 0;},submit(_,start){starts.push(start);}});
await continuous.pump();assert.deepEqual(starts,[.015,.031],'Async completion before queued deadline must retain contiguous samples');
