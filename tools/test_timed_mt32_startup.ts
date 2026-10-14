import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeTimedMt32Device} from '../lib/game/timed-mt32-startup.ts';
import {createSampleTimedMt32Device} from '../lib/game/sample-timed-mt32-device.ts';
import {createMt32ExecutionClock} from '../lib/game/mt32-execution-clock.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
const patch=readFileSync('public/game/original-resources/MT32.PLB');
const legacy=readFileSync('public/game/original-resources/MT15.DRV');
for(const generation of ['ms-1990','ms-1991'] as const){
 for(const failure of ['initial-cancel','yield-cancel','render-failure','short-buffer'] as const){
  let cancelled=failure==='initial-cancel',renders=0,writes=0,yields=0;
  const clock=createMt32ExecutionClock({cpuHz:4772728,pollCycles:20});
  const bridge=createSampleTimedMt32Device({sampleRate:32000,
   write(batch){writes+=batch.length;},
   render(frames){
    renders++;
    if(failure==='render-failure')throw Error('Physical rendering failed');
    return new Float32Array(frames*2-(failure==='short-buffer'?1:0));
   },
  },{...clock,initialPort61:0,read:port=>port===0x330?0xfe:0,write(){},interrupts(){},
   delay(loop,count){clock.delay(loop,count);clock.advanceTo(10000000);},
   cancelled:()=>cancelled,
  });
  const driver=versionedMt15Resource(generation)??legacy;
  const before=Uint8Array.from(driver),patchBefore=Buffer.from(patch);
  await assert.rejects(initializeTimedMt32Device(driver,patch,generation,{
   transport:bridge.transport,now:clock.now,get frame(){return bridge.frame;},output:bridge.output,
   async yieldTask(){yields++;cancelled=true;},
  }),failure.includes('cancel')?{name:'AbortError'}:failure==='render-failure'?/Physical rendering failed/:/incomplete stereo buffer/i);
  if(failure==='initial-cancel'){assert.equal(renders,0);assert.equal(writes,0);}
  if(failure==='yield-cancel'){assert.equal(yields,1);assert.equal(renders,64);}
  if(failure==='render-failure'||failure==='short-buffer'){
   assert.equal(renders,1);assert.throws(()=>bridge.output.render(1),/failed/);
  }
  const count=renders;bridge.close();assert.throws(()=>bridge.output.render(512),/cancelled/);
  assert.equal(renders,count,'Closed startup cannot render more sound');
  assert.deepEqual(Uint8Array.from(driver),before);assert.deepEqual(patch,patchBefore);
 }
}
console.log('Both timed Roland startups cancel before writes or after bounded drain, fail closed on bad synthesis and preserve source resources');
