import assert from 'node:assert/strict';
import {executeReadyMt32Program} from '../lib/game/ready-mt32-program.ts';
import {executeCooperativeReadyMt32Program} from '../lib/game/cooperative-ready-mt32-program.ts';
import {delayMs91Mt32Pit} from '../lib/game/mt32-pit-delay.ts';
import {commandOriginalMt32Mpu} from '../lib/game/mt32-transport.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
assert.throws(()=>executeReadyMt32Program(delayMs91Mt32Pit(400)),/timed host/);
await assert.rejects(executeCooperativeReadyMt32Program(delayMs91Mt32Pit(400),{write(){},cancelled:()=>false}),/timed host/);
assert.equal(executeReadyMt32Program(commandOriginalMt32Mpu(255)).result,0);
assert.equal(await executeCooperativeReadyMt32Program(commandOriginalMt32Mpu(255),{write(){},cancelled:()=>false}),0);
for(const mode of ['cancel-before','cancel-after-yield','write-error','unsupported-pit'] as const){
 let finalized=false,cancelled=mode==='cancel-before',yields=0,writes=0;
 function* transfer():OriginalMt32MpuProgram{
  try{
   yield {kind:'write',port:0x330,value:1};
   if(mode==='unsupported-pit')yield {kind:'read',port:0x42};
   yield {kind:'write',port:0x330,value:2};
   return 0;
  }finally{finalized=true;}
 }
 await assert.rejects(executeCooperativeReadyMt32Program(transfer(),{
  write(){writes++;if(mode==='write-error')throw Error('Device disconnected');},
  cancelled:()=>cancelled,
  operationsPerYield:mode==='unsupported-pit'?10:1,
  async yieldTask(){yields++;if(mode==='cancel-after-yield')cancelled=true;}
 }));
 assert.equal(finalized,true,`${mode}: transfer generator must close`);
 if(mode==='cancel-before'||mode==='unsupported-pit')assert.equal(writes,0,'Buffered writes must not flush after cancellation/failure');
 if(mode==='cancel-after-yield'){assert.equal(writes,1);assert.equal(yields,1);}
}
console.log('Diagnostic Roland hosts reject unsupported countdown instead of inventing elapsed time; legacy command handshake unchanged');
