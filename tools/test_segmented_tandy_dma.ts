import assert from 'node:assert/strict';
import {createOriginalTandyDacTransfer} from '../lib/game/tandy-dac-transfer.ts';
for(const start of [0xfffe,0x3fffe,0xffffe]){
 const reads:number[]=[],profile={pauseAt64KiB:true};const transfer=createOriginalTandyDacTransfer(address=>{reads.push(address);return address&255;},profile);profile.pauseAt64KiB=false;
 const request={ax:0x8307,es:start>>>4,bx:start&15,cx:4,dx:4095};assert.equal(transfer.play(request).carry,false);
 assert.equal(transfer.transferByte()?.completion,null);const second=transfer.transferByte()!;assert.equal(second.segmentBoundary,true);assert.equal(second.completion,null);assert.equal(transfer.segmentPaused,true);
 const paused=transfer.snapshot();assert.equal(paused?.remaining,2);assert.equal(transfer.status().carry,true);assert.equal(transfer.play({...request,bx:0}).carry,true);
 for(let i=0;i<10;i++)assert.equal(transfer.transferByte(),null);assert.deepEqual(transfer.snapshot(),paused);assert.equal(reads.length,2);
 transfer.resumeSegment();assert.equal(transfer.segmentPaused,false);assert.throws(()=>transfer.resumeSegment(),/No pending/);assert.equal(transfer.transferByte()?.completion,null);assert.equal(transfer.transferByte()?.completion,0x91fb);assert.equal(transfer.status().carry,false);
 assert.deepEqual(reads,Array.from({length:4},(_,i)=>(start+i)&0xfffff));assert.equal(transfer.transferByte(),null);assert.throws(()=>transfer.resumeSegment(),/No pending/);
}
const seamless=createOriginalTandyDacTransfer(()=>128);seamless.play({ax:0x8307,es:0xfff,bx:14,cx:4,dx:123});for(let i=0;i<4;i++)assert.ok(seamless.transferByte());assert.equal(seamless.segmentPaused,false);
console.log('Opt-in segmented Tandy DMA holds busy/live address across64KiB and20-bit wrap, ignores grants until explicit restart, and emits completion only at final byte; default transfer unchanged');
