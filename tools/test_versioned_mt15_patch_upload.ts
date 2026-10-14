import assert from 'node:assert/strict';
import {uploadOriginalMt32Patches} from '../lib/game/mt32-system-exclusive.ts';
for(const type of [0,2]){
 const patch=new Uint8Array(1+8+(type===2?246:0));patch[0]=1;patch[1]=type;for(let i=2;i<patch.length;i++)patch[i]=i&127;
 const results=[];
 for(const engine of [undefined,'ms-1990','ms-1991'] as const){
  const driver=new Uint8Array(1750),writes:number[][]=[];let reads61=0;
  const program=uploadOriginalMt32Patches(driver,(_segment,at)=>patch[at],0,0,engine);let step=program.next();
  while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);if(step.value.kind==='read'&&step.value.port===0x61)reads61++;step=program.next(0);}
  results.push({driver,writes,reads61});
 }
 assert.deepEqual(results[0],results[1]);assert.deepEqual(results[2].driver,results[1].driver);
 assert.deepEqual(results[2].writes.filter(([port])=>port===0x330),results[1].writes);
 const payload=type===2?260:11,packets=type===2?2:1;
 assert.equal(results[1].reads61,60000+payload*100);assert.equal(results[2].reads61,2*(payload+packets));
 assert.equal(results[2].driver[0x49],0);
}
console.log('Versioned Roland patch/custom-timbre upload retains MIDI/state; modern uses packet PIT waits, legacy/default keeps original extra reads');
