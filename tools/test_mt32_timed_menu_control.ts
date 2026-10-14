import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createControlledOriginalMt32Music} from '../lib/game/controlled-mt32-music.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
for(const score of ['titl','slct','vict','over']){
 const source=readFileSync(`public/game/mt32-music-${score}-seed.json`,'utf8');
 for(const generation of ['ms-1990','ms-1991'] as const){
  const seed=JSON.parse(source);seed.driverGeneration=generation;
  const resource=versionedMt15Resource(generation);if(resource)seed.driver=Array.from(resource);
  const music=createControlledOriginalMt32Music(seed),before=structuredClone(music.state);
  if(generation==='ms-1991'){
   assert.throws(()=>music.control('pause-audio'),/timed transport/);
   assert.deepEqual(music.state,before,'Rejected synchronous modern operation cannot mark audio paused');
  }
  let clocks=0;const writes:number[][]=[];
  const bus={read:(port:number)=>port===0x330?0xfe:0,write:(p:number,v:number)=>{writes.push([p,v]);},interrupts(){},delay(){},cancelled:()=>false};
  const transport=createMt32PitTransportHost(bus,{initialPort61:0,now:()=>clocks,async poll(){clocks+=97;}});
  const host={execute:program=>executeTimedMt32Program(program,transport),write:(output:number[][])=>{writes.push(...output);}} satisfies Parameters<typeof music.controlTimed>[1];
  const timers=structuredClone(music.runtime.timers);
  const pending=music.controlTimed('pause-audio',host);
  assert.equal(music.state.paused,0,'Control state waits for transport completion');
  assert.throws(()=>music.tick(),/operation is pending/);
  assert.throws(()=>music.control('toggle-music'),/operation is pending/);
  await pending;assert.equal(music.state.paused,1);assert.deepEqual(music.runtime.timers,timers);
  await music.controlTimed('resume-audio',host);assert.equal(music.state.paused,0);
  const restored=structuredClone(music.state);
  await assert.rejects(music.controlTimed('pause-audio',{async execute(){throw Error('Cancelled transfer');},write(){}}),/Cancelled/);
  assert.deepEqual(music.state,restored);
  await assert.rejects(music.controlTimed('pause-audio',{async execute(){return 0xffff;},write(){}}),/transport failed/);
  assert.deepEqual(music.state,restored);
  const volumeOrder:string[]=[];
  const serialHost={...host,async execute(program:Parameters<typeof host.execute>[0]){volumeOrder.push('begin');await Promise.resolve();const code=await host.execute(program);volumeOrder.push('end');return code;}};
  await Promise.all([music.controlTimed('pause-audio',serialHost),music.tickTimed({write(output){volumeOrder.push('tick');writes.push(...output);}}),music.controlTimed('resume-audio',serialHost)]);
  assert.deepEqual(volumeOrder,['begin','end','tick','begin','end'],'Controls and ticks must serialize complete transfers');
  assert.equal(music.state.paused,0,'Resume queued after pause must commit last');
  volumeOrder.length=0;
  const fadeEffect={type:'master-volume' as const,value:98};
  const fading=music.effectTimed(fadeEffect,serialHost);fadeEffect.value=0;
  await Promise.all([fading,music.tickTimed({write(){volumeOrder.push('tick');}})]);
  assert.deepEqual(volumeOrder,['begin','end','tick'],'Fade packet delivery must complete before next music tick');
  assert.deepEqual(writes.slice(-11).map(([,value])=>value),[0xf0,0x41,0x10,0x16,0x12,16,0,22,98,120,0xf7],'Queued fade effect retains supplied volume despite caller mutation');
  assert.ok(writes.some(([port])=>port===0x330));
  const broken=createControlledOriginalMt32Music(seed);let delivered=0;
  const failed=broken.tickTimed({write(){delivered++;throw Error('Partial MIDI delivery');}});
  const queued=broken.tickTimed({write(){delivered++;}});
  await assert.rejects(failed,/Partial MIDI delivery/);
  const retained=structuredClone(broken.runtime.timers);
  await assert.rejects(queued,/recreate controller/);
  await assert.rejects(broken.controlTimed('pause-audio',host),/recreate controller/);
  assert.throws(()=>broken.tick(),/recreate controller/);
  assert.throws(()=>broken.control('toggle-music'),/recreate controller/);
  assert.equal(delivered,1,'No later MIDI output after failed state-advancing tick');
  assert.deepEqual(broken.runtime.timers,retained,'No additional score advancement after failure');
  for(const effect of [{type:'volume' as const,owner:0,value:20},{type:'stop-tracks' as const,first:0,last:0}]){
   const damaged=createControlledOriginalMt32Music(seed);let outputs=0;
   const failingHost={...host,write(){outputs++;throw Error('Effect delivery interrupted');}};
   const failedEffect=damaged.effectTimed(effect,failingHost);
   const nextTick=damaged.tickTimed({write(){outputs++;}});
   await assert.rejects(failedEffect,/Effect delivery interrupted/);
   const retainedTimers=structuredClone(damaged.runtime.timers);
   await assert.rejects(nextTick,/recreate controller/);
   assert.throws(()=>damaged.control('resume-audio'),/recreate controller/);
   assert.equal(outputs,1);assert.deepEqual(damaged.runtime.timers,retainedTimers);
  }
 }
 assert.equal(readFileSync(`public/game/mt32-music-${score}-seed.json`,'utf8'),source);
}
console.log('Eight versioned Roland timed menu controllers wait for volume delivery, preserve timers, resume and retain state after cancellation/failure; virtual clock integration only');
