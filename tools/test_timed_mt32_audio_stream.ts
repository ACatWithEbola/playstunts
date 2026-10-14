import assert from 'node:assert/strict';
import {createMt32AudioStream,createTimedMt32AudioStream} from '../lib/game/mt32-audio-stream.ts';
import {advanceOriginalNestedHardwareClock} from '../lib/game/hardware-clock-memory.ts';
function output(sampleRate:number){
 let note=0,position=0;const writes:number[][]=[];
 return {sampleRate,writes,get position(){return position;},write(values:number[][]){writes.push(...values);for(const [,value] of values)note=value;},render(frames:number){const pcm=new Float32Array(frames*2);for(let i=0;i<frames;i++){pcm[i*2]=note;pcm[i*2+1]=(position++%100)/100;}return pcm;}};
}
for(const rate of [32000,44100,48000]){
 const a=output(rate),b=output(rate),c=output(rate);let ta=0,tb=0,tc=0;
 const sync=createMt32AudioStream(a,()=>[[0x330,++ta]]);
 const whole=createTimedMt32AudioStream(b,async()=>{await Promise.resolve();return [[0x330,++tb]];});
 const split=createTimedMt32AudioStream(c,async()=>{await Promise.resolve();return [[0x330,++tc]];});
 const expected=sync.render(rate),actual=await whole.render(rate);assert.deepEqual(actual,expected);
 const pieces:Promise<Float32Array>[]=[];let frames=0,index=0;
 while(frames<rate){const count=Math.min([1,17,512,333][index++%4],rate-frames);pieces.push(split.render(count));frames+=count;}
 const result=new Float32Array(rate*2);let at=0;for(const piece of await Promise.all(pieces)){result.set(piece,at);at+=piece.length;}
 assert.deepEqual(result,expected);assert.deepEqual(c.writes,a.writes);assert.equal(tc,ta);assert.equal(tb,ta);
}
const device=output(32000);let release:(value:number[][])=>void=()=>{},reached:()=>void=()=>{};
const tickReached=new Promise<void>(resolve=>{reached=resolve;});
const delayed=createTimedMt32AudioStream(device,()=>new Promise(resolve=>{release=resolve;reached();}));
const pending=delayed.render(400);await tickReached;assert.ok(device.position>0&&device.position<400,'Rendering stops at pending original IRQ');
const held=device.position;await Promise.resolve();assert.equal(device.position,held);release([[0x330,7]]);await pending;assert.equal(device.position,400);
const broken=createTimedMt32AudioStream(output(32000),async()=>{throw Error('Disconnected');});
await assert.rejects(broken.render(400),/Disconnected/);await assert.rejects(broken.render(400),/stream failed/);
console.log('Timed Roland stream matches synchronous PCM/IRQ ordering across three rates and concurrent split buffers, waits at pending ticks and rejects partial-failure reuse; synthetic device only');
for(const rate of [32000,44100,48000]){
 const build=()=>{
  const device=output(rate);let busyUntil=0;const ticks:number[]=[],hardware:boolean[]=[];
  const stream=createTimedMt32AudioStream({...device,render:n=>device.render(n),irqReady:()=>device.position>=busyUntil},async()=>{
   ticks.push(device.position);if(ticks.length===1)busyUntil=device.position+Math.ceil(rate*.19);
   return [[0x330,ticks.length]];
  },dispatch=>hardware.push(dispatch));return {stream,ticks,device,hardware};
 };
 const whole=build(),split=build();const expected=await whole.stream.render(rate);
 const actual=new Float32Array(rate*2);
 for(let frame=0;frame<rate;frame+=512){const count=Math.min(512,rate-frame);actual.set(await split.stream.render(count),frame*2);}
 assert.deepEqual(actual,expected);assert.deepEqual(split.ticks,whole.ticks);
 assert.deepEqual(split.hardware,whole.hardware);
 assert.ok(whole.hardware.filter(dispatch=>!dispatch).length>=18,'Busy transport must not erase hardware IRQ boundaries');
 assert.equal(whole.hardware.filter(Boolean).length,whole.ticks.length);
 assert.ok(whole.ticks[1]-whole.ticks[0]>=Math.ceil(rate*.19),'No callback reentry while earlier transfer is ahead');
 assert.equal(whole.device.position,rate,'Audio advances throughout guarded IRQs');
}
console.log('Timed IRQ guard retains sample/hardware phase across split buffers while suppressing transport reentry');
// Explicit original-memory owner: the stream must notify guarded hardware
// boundaries, rather than erase them or replay a backlog of music callbacks.
{
 const d=0x2d1a0,memory=new Uint8Array(0x100000),view=new DataView(memory.buffer);
 view.setUint16(d+0x4086,5,true);view.setUint16(d+0x4088,5,true);
 const device=output(32000);let busyUntil=0,hardwareTicks=0,musicTicks=0,guardedTicks=0;
 const stream=createTimedMt32AudioStream({...device,render:n=>device.render(n),irqReady:()=>device.position>=busyUntil},async()=>{
  if(++musicTicks===1)busyUntil=device.position+6080;
  return [];
 },dispatch=>{
  hardwareTicks++;
  // Explicit test owner controls the outer-handler lifecycle; this is not
  // automatic production guard initialization or completion-time proof.
  if(dispatch){memory[d+0x408e]=0;view.setUint16(d+0x408c,0,true);}
  else guardedTicks++;
  advanceOriginalNestedHardwareClock(memory,d);
  if(dispatch)memory[d+0x408e]=1;
 });
 await stream.render(32000);
 assert.equal(view.getUint32(d+0x407a,true),hardwareTicks);
 assert.equal(view.getUint32(d+0x407e,true),Math.floor(hardwareTicks/5));
 assert.equal(hardwareTicks,musicTicks+guardedTicks);
 assert.ok(guardedTicks>=18);
 assert.ok(view.getUint16(d+0x408a,true)>=18);
 const failedDevice=output(32000);let observed=0,called=0;
 const failed=createTimedMt32AudioStream(failedDevice,async()=>{called++;return [];},()=>{observed++;throw Error('Clock owner failed');});
 await assert.rejects(failed.render(400),/Clock owner failed/);
 await assert.rejects(failed.render(400),/stream failed/);
 assert.equal(observed,1);assert.equal(called,0);
}
console.log('Explicit original-memory clock owner retains guarded counter updates; observer failure poisons stream without invoking or retrying music');
