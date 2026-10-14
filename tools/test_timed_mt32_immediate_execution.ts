/** Compare the immediate-response optimization to the prior await-every-op
 * executor on complete original volume programs. No original delay is removed. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {executeTimedMt32Program,type TimedMt32Host} from '../lib/game/timed-mt32-program.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
import {createMt32ExecutionClock} from '../lib/game/mt32-execution-clock.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
async function previous(program:OriginalMt32MpuProgram,host:TimedMt32Host){
 let step=program.next(),operations=0;
 try{while(!step.done){if(host.cancelled())throw Error('cancelled');const op=step.value;let value=0;
  if(op.kind==='read')value=await host.read(op.port);
  else if(op.kind==='write')await host.write(op.port,op.value);
  else if(op.kind==='interrupts')await host.interrupts(op.enabled);
  else await host.delay(op.loop,op.iterations);
  if(host.yieldTask&&++operations===4096){operations=0;await host.yieldTask();}
  step=program.next(value);
 }return step.value;}finally{program.return(0);}
}
const source=JSON.parse(readFileSync('public/game/mt32-music-slct-seed.json','utf8'));
async function probe(generation:'ms-1990'|'ms-1991',execute:typeof executeTimedMt32Program){
 const clock=createMt32ExecutionClock({cpuHz:4772728,pollCycles:20});
 const music=createOriginalMt32MusicRuntime(versionedMt32MusicSeed(source,generation));
 const hash=createHash('sha256'),buffer=Buffer.alloc(4096*12);let at=0,operations=0,yields=0;
 const midi:number[][]=[];
 const trace=(kind:number,port:number,value:number)=>{buffer.writeUInt32LE(kind,at);buffer.writeUInt32LE(port,at+4);buffer.writeUInt32LE(value,at+8);at+=12;operations++;if(at===buffer.length){hash.update(buffer);at=0;}};
 const bus=createMt32PitTransportHost({read:()=>0,write(port,value){if(port===0x330)midi.push([clock.now(),value]);},interrupts(){},delay:(loop,count)=>clock.delay(loop,count),cancelled:()=>false}, {now:clock.now,poll:clock.poll,initialPort61:0});
 const host:TimedMt32Host={read(port){const response=bus.read(port);if(typeof response==='number'){trace(0,port,response);return response;}return response.then(value=>{trace(0,port,value);return value;});},write(port,value){trace(1,port,value);return bus.write(port,value);},interrupts(enabled){trace(2,0,Number(enabled));return bus.interrupts(enabled);},delay(loop,count){trace(3,0,count);return bus.delay(loop,count);},cancelled:()=>false,async yieldTask(){yields++;}};
 const started=performance.now();for(let value=100;value>0;value-=2)assert.equal(await execute(music.masterVolumeProgram(value),host),0);
 const elapsedMilliseconds=performance.now()-started;hash.update(buffer.subarray(0,at));
 return {elapsedMilliseconds,operations,yields,trace:hash.digest('hex'),midi,clock:clock.now()};
}
for(const generation of ['ms-1990','ms-1991'] as const){
 for(const order of ['previous-first','optimized-first']){
  const first=await probe(generation,order==='previous-first'?previous:executeTimedMt32Program);
  const second=await probe(generation,order==='previous-first'?executeTimedMt32Program:previous);
  const old=order==='previous-first'?first:second,next=order==='previous-first'?second:first;
  assert.deepEqual({...next,elapsedMilliseconds:0},{...old,elapsedMilliseconds:0},'Every port event, timestamped MIDI byte, yield and modeled clock must match');
  console.log(JSON.stringify({generation,order,previousMilliseconds:+old.elapsedMilliseconds.toFixed(2),optimizedMilliseconds:+next.elapsedMilliseconds.toFixed(2),portOperations:next.operations,modeledClocks:next.clock,trace:next.trace,scope:'Local Node processing comparison, not browser stutter acceptance'}));
 }
}
