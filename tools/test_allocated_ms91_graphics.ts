import assert from 'node:assert/strict';
import {selectAllocatedMs91Graphics} from '../lib/game/allocated-mouse-selection.ts';
for(const fail of [false,true]){
 const memory=new Uint8Array(65536),v=new DataView(memory.buffer),calls:string[]=[];
 memory[0x134]=2;memory[0x131]=1;memory[0x132]=1;
 // Active cadence is deliberately independent of future configuration.
 v.setUint16(0x73b2,123,true);v.setUint16(0x8fd8,123,true);
 const settings={graphics:0,slowVideoManagement:true,configuredFramesPerSecond:20 as 10|20};
 const choices=[4,5,7,9];let dialogs=0;
 const host={memory:()=>memory,audio(operation:'pause-audio'|'resume-audio'){calls.push(operation);},hideCursor(){throw Error('Cursor must remain visible');},async dialog(resource:string,mode:number,selected:number,border:number,marked?:readonly boolean[]){
  assert.equal(v.getUint16(0x4090,true),1);
  if(fail)throw Error('Injected modern dialog failure');
  if(resource==='emrs'){assert.equal(mode,4);assert.equal(marked,undefined);calls.push('notice');return 0;}
  assert.equal(resource,'emrl');assert.equal(mode,2);assert.equal(marked?.filter(Boolean).length,3);
  if(dialogs===0)assert.equal(marked?.[2],true,'Current detail overrides stale future detail');
  return choices[dialogs++];
 }};
 if(fail)await assert.rejects(()=>selectAllocatedMs91Graphics(host,0,settings),/Injected/);
 else {await selectAllocatedMs91Graphics(host,0,settings);assert.deepEqual(settings,{graphics:4,slowVideoManagement:false,configuredFramesPerSecond:10});assert.equal(memory[0x134],4);assert.equal(dialogs,4);}
 assert.equal(v.getUint16(0x73b2,true),123);assert.equal(v.getUint16(0x8fd8,true),123);
 assert.equal(v.getUint16(0x4090,true),0);assert.equal(memory[0x33aa],0);assert.equal(memory[0x131],1);assert.equal(memory[0x132],1);
 assert.deepEqual(calls,fail?['pause-audio','resume-audio']:['pause-audio','notice','resume-audio']);
}
console.log('Allocated MS91 graphics choices, marks and notice preserve race counters and restore modal state on failure');
