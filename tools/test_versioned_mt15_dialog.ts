import assert from 'node:assert/strict';
import {controlAllocatedMt32DialogAudio} from '../lib/game/allocated-mt32-dialog-audio.ts';
for(const generation of [undefined,'ms-1990','ms-1991'] as const){
 const memory=new Uint8Array(0x100000),d=0x60000;memory[d+0x4e06]=1;memory[d+0x9fe4]=16;memory.set([0x10,0,0x16,100],d+0x4e08);
 const tail=0x80000+(generation==='ms-1991'?1750:1667);memory[tail]=173;
 for(const operation of ['pause-audio','resume-audio'] as const){
  const program=controlAllocatedMt32DialogAudio(memory,d,0x8000,operation,generation),writes:number[][]=[];let next=program.next();
  while(!next.done){if(next.value.kind==='write')writes.push([next.value.port,next.value.value]);next=program.next(0);}
  assert.equal(memory[d+0x4e02],operation==='pause-audio'?1:0);assert.equal(memory[d+0x4e0b],operation==='pause-audio'?0:100);assert.equal(memory[d+0x4e0c],0);
  assert.equal(writes.some(([port])=>port===0x42),generation==='ms-1991');assert.equal(memory[tail],173);
 }
 const cancelled=controlAllocatedMt32DialogAudio(memory,d,0x8000,'pause-audio',generation);cancelled.next();cancelled.return(0);
 assert.equal(memory[d+0x4e02],0);assert.equal(memory[d+0x4e0c],0);assert.equal(memory[d+0x4e0b],100,'Interrupted dialog restores retained state');
}
console.log('Roland dialog pause/resume forwards retained generation, restores guards/volume and leaves outside-driver bytes unchanged');
