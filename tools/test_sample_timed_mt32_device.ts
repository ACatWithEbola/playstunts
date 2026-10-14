import assert from 'node:assert/strict';
import {createSampleTimedMt32Device} from '../lib/game/sample-timed-mt32-device.ts';
import {PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
for(const sampleRate of [32000,44100,48000]){
 let clock=0,note=0,frame=0,cancelled=false;
 const writes:{frame:number;value:number}[]=[];
 const device=createSampleTimedMt32Device({sampleRate,
  write(values){for(const [,value] of values){note=value;writes.push({frame,value});}},
  render(count){frame+=count;return new Float32Array(count*2).fill(note);}},
 {now:()=>clock,advanceTo:value=>{clock=value;},async poll(){clock++;},initialPort61:0,
  read:()=>0,write(){assert.fail('Unexpected non-MIDI port');},interrupts(){},delay(){},cancelled:()=>cancelled});
 clock=100;await device.transport.write(0x330,7);
 const boundary=Math.ceil(100*sampleRate/PC_PIT_INPUT_HZ);
 assert.equal(device.output.lastWriteFrame,boundary);
 const pcm=device.output.render(512);
 assert.equal(device.output.renderedFrame,512);
 assert.ok(pcm.slice(0,boundary*2).every(v=>v===0));assert.ok(pcm.slice(boundary*2).every(v=>v===7));
 assert.deepEqual(writes,[{frame:boundary,value:7}]);
 assert.ok(clock>=Math.ceil(512*PC_PIT_INPUT_HZ/sampleRate));
 await device.transport.write(0x330,9);device.output.render(512);
 assert.equal(writes[1].frame,Math.ceil(Math.ceil(512*PC_PIT_INPUT_HZ/sampleRate)*sampleRate/PC_PIT_INPUT_HZ));
 assert.throws(()=>device.output.write([[0x330,1]]),/Untimed/);
 cancelled=true;assert.equal(device.transport.cancelled(),true);
 cancelled=false;clock+=PC_PIT_INPUT_HZ;await device.transport.write(0x330,11);
 const emitted=writes.length;device.close();device.close();
 assert.equal(device.transport.cancelled(),true);
 assert.throws(()=>device.output.render(sampleRate*2),/cancelled/);
 await assert.rejects(async()=>{await device.transport.write(0x330,12);},/cancelled/);
 assert.equal(writes.length,emitted,'Closed timeline never delivers future MIDI');
}
console.log('Shared Roland transport/synthesis timeline places bytes at exact sample boundaries across three rates and advances caller clock; virtual execution profile only');
