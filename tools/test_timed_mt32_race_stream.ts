import assert from 'node:assert/strict';
import {createTimedMt32RaceStream} from '../lib/game/timed-mt32-race-stream.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import {applyOriginalMt32DriverControl} from '../lib/game/mt32-driver-control.ts';
for(const generation of ['ms-1990','ms-1991'] as const){
 const writes:number[][]=[];let clocks=0,ticks=0,frames=0;
 const host=createMt32PitTransportHost({read:()=>0,write:(port,value)=>{writes.push([port,value]);},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>clocks,async poll(){clocks++;}});
 const output={sampleRate:32000,write(values:number[][]){writes.push(...values);},render(count:number){frames+=count;return new Float32Array(count*2);}};
 const driver=new Uint8Array(generation==='ms-1991'?1750:1667),patch=new Uint8Array(100);patch[18]=12;patch[68]=7;patch[70]=64;
 const expected=applyOriginalMt32DriverControl('instrument',1,new Uint8Array(46),patch,0,0,generation).writes;
 const stream=createTimedMt32RaceStream(output,host,()=>driver,generation,()=>{ticks++;return [[0x330,0x90],[0x330,60],[0x330,100]];});
 const input=expected.map(pair=>pair.slice()),write=stream.writeAsync(input);input[0][1]=0;
 const render=stream.render(400);await write;assert.deepEqual(writes,expected,'Control delivery snapshots input before queued rendering');
 const pcm=await render;assert.equal(pcm.length,800);assert.equal(frames,400);assert.equal(ticks,1);
 assert.equal(clocks,generation==='ms-1991'?4*201+32501:0);
 assert.deepEqual(writes.slice(expected.length),[[0x330,0x90],[0x330,60],[0x330,100]]);
 await assert.rejects(stream.writeAsync([[0x331,0]]),/Invalid/);
 const before=ticks;await assert.rejects(stream.render(400),/stream failed/);assert.equal(ticks,before);
 stream.close();await assert.rejects(stream.render(1),{name:'AbortError'});
}
console.log('Both timed race adapters serialize control/IRQ delivery, retain exact MIDI/waits, snapshot inputs and reject failed/closed reuse; synthetic output only');
{
 let release!:()=>void,entered=false,stopped=false;
 const host={read:()=>0,write:async()=>{entered=true;await new Promise<void>(r=>release=r);},interrupts(){},delay(){},cancelled:()=>false};
 const stream=createTimedMt32RaceStream({sampleRate:32000,write(){},render:n=>new Float32Array(n*2)},host,()=>new Uint8Array(1667),'ms-1990',()=>[]);
 const delivery=stream.writeAsync([[0x330,0x90]]);const rejected=assert.rejects(delivery,{name:'AbortError'});
 for(let i=0;i<8;i++)await Promise.resolve();assert.equal(entered,true);
 let drained=false;const draining=stream.drain().then(()=>{drained=true;});
 const drainRejected=assert.rejects(draining,{name:'AbortError'});
 for(let i=0;i<8;i++)await Promise.resolve();assert.equal(drained,false);
 const closing=stream.closeAsync().then(()=>{stopped=true;});
 for(let i=0;i<8;i++)await Promise.resolve();assert.equal(stopped,false,'Shutdown must await an in-flight physical host operation');
 release();await rejected;await drainRejected;await closing;assert.equal(stopped,true);
 await assert.rejects(stream.writeAsync([[0x330,0x90]]),{name:'AbortError'});
}
console.log('Timed race shutdown waits for pending transport before allowing device release');
{
 let release!:()=>void,continued=false;const writes:number[][]=[];
 const host={read:()=>0,async write(port:number,value:number){writes.push([port,value]);await new Promise<void>(r=>release=r);},interrupts(){},delay(){},cancelled:()=>false};
 const stream=createTimedMt32RaceStream({sampleRate:32000,write(){},render:n=>new Float32Array(n*2)},host,()=>new Uint8Array(1667),'ms-1990',()=>{throw Error('Synchronous callback must not run');},undefined,async deliver=>{await deliver([[0x330,0x90]]);continued=true;return [];});
 const pending=stream.render(400);for(let i=0;i<20;i++)await Promise.resolve();
 assert.deepEqual(writes,[[0x330,0x90]]);assert.equal(continued,false);
 release();await pending;assert.equal(continued,true);assert.equal(writes.length,1,'Already delivered IRQ bytes must not be emitted again');await stream.closeAsync();
}
console.log('Awaited race callback delivery completes before its trailing simulation work without duplicate MIDI');
