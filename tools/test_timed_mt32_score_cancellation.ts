import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTimedMt32ScoreStream} from '../lib/game/timed-mt32-score-stream.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import type {TimedMt32Host} from '../lib/game/timed-mt32-program.ts';
class OwnedTransport implements TimedMt32Host{
 private readonly owner:TimedMt32Host;
 constructor(owner:TimedMt32Host){this.owner=owner;}
 read(port:number){assert.ok(this instanceof OwnedTransport);return this.owner.read(port);}
 write(port:number,value:number){assert.ok(this instanceof OwnedTransport);return this.owner.write(port,value);}
 interrupts(enabled:boolean){assert.ok(this instanceof OwnedTransport);return this.owner.interrupts(enabled);}
 delay(loop:'decrement-dx',iterations:number){assert.ok(this instanceof OwnedTransport);return this.owner.delay(loop,iterations);}
 cancelled(){assert.ok(this instanceof OwnedTransport);return this.owner.cancelled();}
}
for(const generation of ['ms-1990','ms-1991'] as const){
 const source=JSON.parse(readFileSync('public/game/mt32-music-titl-seed.json','utf8'));
 const seed=versionedMt32MusicSeed(source,generation),before=structuredClone(seed);
 let clock=0,hold=false,entered:()=>void=()=>{},release:()=>void=()=>{},writes=0,frames=0;
 const reached=new Promise<void>(resolve=>{entered=resolve;});
 const transport=new OwnedTransport(createMt32PitTransportHost({read:()=>0,
  async write(){writes++;if(hold){hold=false;entered();await new Promise<void>(resolve=>{release=resolve;});}},
  interrupts(){},delay(){},cancelled:()=>false},
  {initialPort61:0,now:()=>clock,async poll(){clock+=97;}}));
 const stream=await createTimedMt32ScoreStream(seed,{sampleRate:32000,
  write(){},render(count){frames+=count;return new Float32Array(count*2);}},transport);
 hold=true;
 const pending=stream.render(32000);
 // Attach rejection handling before releasing the transfer.
 const rejected=assert.rejects(pending,/cancelled/);
 await reached;const delivered=writes,rendered=frames;
 const queued=stream.render(512),queuedRejected=assert.rejects(queued,/stream failed/);
 stream.close();release();await rejected;await queuedRejected;
 assert.equal(writes,delivered,'No later MIDI byte after close');
 assert.equal(frames,rendered,'No later PCM after close');
 assert.throws(()=>stream.render(512),/cancelled/);
 await assert.rejects(stream.control('pause-audio'),/state delivery failed|cancelled/);
 assert.deepEqual(seed,before,'Cancellation does not mutate source seed');
 assert.equal(source.driverGeneration??'ms-1990','ms-1990');
 const replacement=await createTimedMt32ScoreStream(seed,{sampleRate:32000,write(){},render(count){return new Float32Array(count*2);}},transport);
 let firstWait:()=>void=()=>{},resumeFirst:()=>void=()=>{},oldStops=0,newStops=0;
 const waiting=new Promise<void>(resolve=>{firstWait=resolve;});
 const oldFade=replacement.fadeOut(async()=>{firstWait();await new Promise<void>(resolve=>{resumeFirst=resolve;});},()=>{oldStops++;});
 const oldRejected=assert.rejects(oldFade,/superseded/);await waiting;
 await replacement.fadeOut(async()=>{},()=>{newStops++;});
 const afterNewFade=writes;resumeFirst();await oldRejected;
 assert.equal(oldStops,0);assert.equal(newStops,1);
 assert.equal(writes,afterNewFade,'Superseded fade cannot restore volume or stop replacement stream');
 replacement.close();
 const barrier=await createTimedMt32ScoreStream(seed,{sampleRate:32000,irqReady:()=>false,write(){},render(count){return new Float32Array(count*2);}},transport);
 let barrierEntered:()=>void=()=>{},releaseBarrier:()=>void=()=>{};
 const atBarrier=new Promise<void>(resolve=>{barrierEntered=resolve;});
 const fading=barrier.fadeOut(async()=>{assert.fail('Fade delay must not start ahead of delivery');},()=>{assert.fail('Cancelled delivery cannot stop a replacement stream');},async()=>{barrierEntered();await new Promise<void>(resolve=>{releaseBarrier=resolve;});});
 const fadeRejected=assert.rejects(fading,{name:'AbortError'});await atBarrier;
 const beforeBarrierCancel=writes;barrier.close();releaseBarrier();await fadeRejected;
 assert.equal(writes,beforeBarrierCancel,'Cancelled delivery barrier cannot send another volume or final restore');
}
console.log('Both Roland generations cancel in-flight score delivery and fade synchronization, reject queued renders and controls, and retain source seeds; virtual transport only');
