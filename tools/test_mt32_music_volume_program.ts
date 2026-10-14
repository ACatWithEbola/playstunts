import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
import {executeReadyMt32Program} from '../lib/game/ready-mt32-program.ts';
let cases=0;
for(const name of ['titl','slct','vict','over']){
 const source=readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8');
 for(const value of [0,1,64,100,127]){
  const outputs=[];
  for(const generation of ['ms-1990','ms-1991'] as const){
   const seed=JSON.parse(source);seed.driverGeneration=generation;
   const resource=versionedMt15Resource(generation);if(resource)seed.driver=Array.from(resource);
   const before=structuredClone(seed),runtime=createOriginalMt32MusicRuntime(seed);
   for(const invalid of [-1,128,1.5,NaN])assert.throws(()=>runtime.masterVolumeProgram(invalid),/Invalid Roland/);
   const program=runtime.masterVolumeProgram(value),writes:number[][]=[];let timerReads=0,step=program.next();
   // Explicit virtual responses only: trace wiring, not elapsed-time proof.
   while(!step.done){const op=step.value;if(op.kind==='write')writes.push([op.port,op.value]);if(op.kind==='read'&&op.port===0x42)timerReads++;step=program.next(op.kind==='read'&&op.port===0x330?0xfe:0);}
   assert.equal(step.value,0);
   outputs.push(writes.filter(([port])=>port===0x330));
   if(generation==='ms-1991'){
    assert.ok(timerReads>0,'Modern volume must retain PIT countdown operations');
    assert.throws(()=>executeReadyMt32Program(runtime.masterVolumeProgram(value)),/timed host/);
    assert.throws(()=>runtime.control({type:'master-volume',value}),/timed transport/);
   }else{
    assert.equal(timerReads,0);
    assert.deepEqual(runtime.control({type:'master-volume',value}).writes,writes);
   }
   assert.deepEqual(seed,before,'Program cannot rewrite captured seed');cases++;
  }
  assert.deepEqual(outputs[1],outputs[0],'Timing generation must not change volume MIDI payload');
 }
 assert.equal(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8'),source);
}
console.log(`${cases} Roland music-volume program cases retain generation-specific transport, identical MIDI payload, legacy synchronous output and modern ready-host rejection; virtual trace only`);
