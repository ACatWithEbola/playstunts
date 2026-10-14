import assert from 'node:assert/strict';
import {createPacedMt32Output} from '../lib/game/paced-mt32-output.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
import {applyOriginalMt32DriverControl} from '../lib/game/mt32-driver-control.ts';
import {createMt32MusicWriteProgram} from '../lib/game/mt32-music-write-program.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
for(const rate of [32000,44100,48000]){
 function make(){let value=0,frames=0;const deliveries:number[][]=[];const device={sampleRate:rate,write(writes:number[][]){for(const [,v] of writes){value=v;deliveries.push([frames,v]);}},render(count:number){assert.ok(count<=512);frames+=count;return new Float32Array(count*2).fill(value);}};return {stream:createPacedMt32Output(device),deliveries};}
 const a=make(),b=make(),events=[[0,1],[201,2],[32768,3],[65536,4]];
 for(const [clock,value] of events){a.stream.schedule(clock,[[0x330,value]]);b.stream.schedule(clock,[[0x330,value]]);}
 const whole=a.stream.render(rate),parts=new Float32Array(rate*2);let at=0;
 while(at<rate){const frames=Math.min(137,rate-at);parts.set(b.stream.render(frames),at*2);at+=frames;}
 assert.deepEqual(parts,whole);assert.deepEqual(a.deliveries,b.deliveries);
 assert.deepEqual(a.deliveries,events.map(([clock,value])=>[Math.ceil(clock*rate/PC_PIT_INPUT_HZ),value]));
 assert.throws(()=>a.stream.schedule(65536,[[0x330,5]]),/behind/);
 const input=[[0x330,9]],c=make();c.stream.schedule(0,input);input[0][1]=99;assert.equal(c.stream.render(1)[0],9,'Scheduled bytes own independent copies');
 assert.throws(()=>c.stream.schedule(-1,[]),/scheduled clock/);
 // Whole transport-to-synthesis boundary, not independently invented events.
 let clock=0,rendered=0;const scheduled:number[][]=[],delivered:number[][]=[];
 const paced=createPacedMt32Output({sampleRate:rate,write(writes){for(const [,value] of writes)delivered.push([rendered,value]);},render(frames){rendered+=frames;return new Float32Array(frames*2);}});
 const host=createMt32PitTransportHost({read:()=>0,write(port,value){scheduled.push([clock,value]);paced.schedule(clock,[[port,value]]);},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>clock,async poll(){clock++;}});
 const patch=new Uint8Array(100);patch[18]=12;patch[68]=7;patch[69]=100;patch[70]=64;
 const writes=applyOriginalMt32DriverControl('instrument',1,new Uint8Array(46),patch,0,0,'ms-1991').writes;
 await executeTimedMt32Program(createMt32MusicWriteProgram(new Uint8Array(1750),writes,'ms-1991'),host);
 assert.equal(clock,4*201+32501);assert.deepEqual(delivered,[],'Transport schedules but does not render or deliver early');
 paced.render(Math.ceil(clock*rate/PC_PIT_INPUT_HZ)+1);
 assert.deepEqual(delivered,scheduled.map(([at,value])=>[Math.ceil(at*rate/PC_PIT_INPUT_HZ),value]));
 const packetEnd=scheduled.findIndex(([,value])=>value===0xf7);
 assert.equal(scheduled[packetEnd][0],804);assert.equal(scheduled[packetEnd+1][0],33305,'Following controller waits until packet delay ends');
}
console.log('Paced Roland output delivers exact PIT-to-sample boundaries and complete timed instrument transfers at three rates, partition-exact buffers, independent queued bytes and late-write rejection; synthetic output only');
for(const failure of ['write','render','short-buffer']){
 let writes=0,renders=0;
 const stream=createPacedMt32Output({sampleRate:32000,write(){writes++;if(failure==='write')throw Error('Device disconnected');},render(frames){renders++;if(failure==='render')throw Error('Device render failed');return new Float32Array(failure==='short-buffer'?0:frames*2);}});
 stream.schedule(0,[[0x330,0x90]]);stream.schedule(1000,[[0x330,64]]);
 assert.throws(()=>stream.render(50),failure==='write'?/disconnected/:failure==='render'?/render failed/:/incomplete/);
 const counts=[writes,renders];
 assert.throws(()=>stream.render(50),/paced output failed/);
 assert.throws(()=>stream.schedule(2000,[[0x330,127]]),/paced output failed/);
 assert.deepEqual([writes,renders],counts,'Failed output cannot replay delivered bytes or advance synthesis on retry');
}
assert.throws(()=>createPacedMt32Output({sampleRate:NaN,write(){},render(){return new Float32Array();}}),/sample rate/);
console.log('Paced Roland partial write/render/short-buffer failures fail closed without repeated MIDI or synthesis');
