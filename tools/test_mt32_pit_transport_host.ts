import assert from 'node:assert/strict';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {delayMs91Mt32Pit} from '../lib/game/mt32-pit-delay.ts';
import {readFileSync} from 'node:fs';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
import {initializeOriginalMt32} from '../lib/game/mt32-system-exclusive.ts';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {mt32OddMode3Counter,mt32DelayCounterFirstHighHalf} from '../lib/game/mt32-delay-counter.ts';
assert.deepEqual(Array.from({length:10},(_,i)=>mt32OddMode3Counter(i+1,5)),[4,2,0,4,2,4,2,0,4,2],'Datasheet Figure18 odd-count example');
for(let clock=1;clock<=32767;clock++)assert.equal(mt32OddMode3Counter(clock),mt32DelayCounterFirstHighHalf(clock));
assert.deepEqual([32768,32769,65535,65536].map(n=>mt32OddMode3Counter(n)),[0,65534,2,65534]);
for(const [ticks,expected] of [[400,201],[65000,32501]]){
 let clocks=1000,polls=0;const writes:number[][]=[];
 const host=createMt32PitTransportHost({read:()=>0,write:(p,v)=>{writes.push([p,v]);},interrupts(){},delay(){assert.fail('No CPU delay expected');},cancelled:()=>false},{initialPort61:0xa0,now:()=>clocks,async poll(){clocks++;polls++;}});
 await host.write(0x61,0xa0);
 assert.equal(await executeTimedMt32Program(delayMs91Mt32Pit(ticks),host),0);
 assert.equal(polls,expected);assert.equal(clocks,1000+expected);
 assert.equal(await host.read(0x61),0xa0,'Original gate bit must clear without altering other bits');
 assert.deepEqual(writes,[],'PIT control must not be sent to MIDI device');
 await host.write(0x330,12);assert.deepEqual(writes,[[0x330,12]]);
}
let clocks=0;
let invalidWrites=0;
const validated=createMt32PitTransportHost({read:()=>0,write(){invalidWrites++;},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0xa0,now:()=>0,async poll(){}});
for(const port of [-1,65536,NaN,0.5]){
 assert.throws(()=>validated.read(port),/port number/);
 await assert.rejects(async()=>await validated.write(port,0),/port number/);
}
for(const value of [-1,256,NaN,0.5])await assert.rejects(async()=>await validated.write(0x61,value),/port byte/);
assert.equal(validated.read(0x61),0xa0);assert.equal(invalidWrites,0,'Rejected inputs never reach device');
const late=createMt32PitTransportHost({read:()=>0,write(){},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>clocks,async poll(){clocks+=40000;}});
assert.equal(await executeTimedMt32Program(delayMs91Mt32Pit(400),late),0,'Late read uses actual low-phase count');
for(const advance of [0,-1]){
 let time=100;
 const stalled=createMt32PitTransportHost({read:()=>0,write(){},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>time,async poll(){time+=advance;}});
 await assert.rejects(executeTimedMt32Program(delayMs91Mt32Pit(400),stalled),advance===0?/did not advance/:/backwards/);
}
// Execute complete startup and result/menu volume programs through the bridge.
// Poll stride is explicit virtual host policy, not recovered CPU instruction cost.
for(const stride of [1,97,511,512]){
 let elapsed=0,cpuDelayCalls=0;const midi:number[]=[];
 const host=createMt32PitTransportHost({
  read:port=>port===0x330?0xfe:0,
  write(port,value){if(port===0x330)midi.push(value);else assert.equal(port,0x331);},
  interrupts(){},delay(loop,iterations){assert.equal(loop,'decrement-dx');assert.equal(iterations,65536);cpuDelayCalls++;},cancelled:()=>false,
 },{initialPort61:0,now:()=>elapsed,async poll(){elapsed+=stride;}});
 const driver=versionedMt15Resource('ms-1991')!;
 assert.equal(await executeTimedMt32Program(initializeOriginalMt32(driver,'ms-1991'),host),0xfff6);
 assert.equal(cpuDelayCalls,1,'Startup retains explicit host-owned CPU loop');
 for(const score of ['titl','slct','vict','over']){
  const seed=JSON.parse(readFileSync(`public/game/mt32-music-${score}-seed.json`,'utf8'));
  seed.driverGeneration='ms-1991';seed.driver=Array.from(driver);
  const runtime=createOriginalMt32MusicRuntime(seed);
  assert.equal(await executeTimedMt32Program(runtime.masterVolumeProgram(100),host),0);
 }
 const expected=(23+4*4)*Math.ceil(201/stride)*stride+5*Math.ceil(32501/stride)*stride;
 assert.equal(elapsed,expected,'Every payload and completed packet retains its original delay');
 let packets=0;
 for(let at=0;at<midi.length;at++)if(midi[at]===0xf0){
  const end=midi.indexOf(0xf7,at);assert.ok(end>at);
  assert.deepEqual(midi.slice(at,at+5),[0xf0,0x41,0x10,0x16,0x12]);
  assert.equal(midi.slice(at+5,end).reduce((sum,byte)=>sum+byte,0)&127,0,'Roland packet checksum');
  packets++;at=end;
 }
 assert.equal(packets,5,'Startup display and four volume packets all delivered');
 assert.equal(await host.read(0x61),0,'Final packet must release PIT gate');
}
console.log('Clock-owned Roland PIT bridge matches datasheet odd-count sequence, both phases/rollover, exact thresholds, gate bits and MIDI isolation; virtual clocks, not browser elapsed-time proof');
