import assert from 'node:assert/strict';
import {initializeOriginalPcSpeakerMemory} from '../lib/game/initialize-pc-speaker-memory.ts';
import {controlAllocatedPcSpeakerDialogAudio} from '../lib/game/allocated-pc-speaker-dialog-audio.ts';
for(const engine of ['ms-1990','ms-1991'] as const){
 const memory=new Uint8Array(0x100000),d=0x60000,driver=0x8000,base=driver*16;
 await initializeOriginalPcSpeakerMemory(memory,d,driver,0,engine);
 const slots=engine==='ms-1991'?7:5,volumeBase=engine==='ms-1991'?0x1bd:0x1b7;
 memory[d+0x4e05]=1;
 for(let i=0;i<slots;i++){
  memory[d+0xa036+i*46]=i;
  memory[d+0x8046+i*72]=40+i;
  memory[base+volumeBase+i]=40+i;
 }
 // Replay generation is deliberately absent: retained driver layout governs audio.
 const protectedTail=base+(engine==='ms-1991'?0x2e9:0x2df);
 memory[protectedTail]=173;
 const writes=controlAllocatedPcSpeakerDialogAudio(memory,d,driver,'pause-audio',0);
 assert.ok(writes.length>0);
 for(let i=0;i<slots;i++)assert.equal(memory[base+volumeBase+i],0);
 controlAllocatedPcSpeakerDialogAudio(memory,d,driver,'resume-audio',0);
 for(let i=0;i<slots;i++)assert.equal(memory[base+volumeBase+i],40+i);
 assert.equal(memory[protectedTail],173);
 assert.equal(memory[d+0x4e02],0);
}
console.log('Allocated PC15 dialog pause/resume preserves five/seven-slot gains and bytes outside loaded driver');
