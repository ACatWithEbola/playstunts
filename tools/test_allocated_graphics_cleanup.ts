import assert from 'node:assert/strict';
import {selectAllocatedGraphicsLevel} from '../lib/game/allocated-mouse-selection.ts';
for(const result of [0,4,-1,'failure'] as const){
 const memory=new Uint8Array(65536),view=new DataView(memory.buffer),calls:string[]=[];
 memory[0x134]=2;memory[0x131]=1;memory[0x132]=1;
 const host={memory:()=>memory,audio(operation:'pause-audio'|'resume-audio'){calls.push(operation);},async dialog(){assert.equal(view.getUint16(0x4090,true),1);if(result==='failure')throw Error('Injected graphics dialog failure');return result;},hideCursor(){throw Error('Visible retained cursor must not be hidden');}};
 if(result==='failure')await assert.rejects(()=>selectAllocatedGraphicsLevel(host,0),/Injected/);else await selectAllocatedGraphicsLevel(host,0);
 assert.equal(memory[0x134],result==='failure'||result===-1?2:result);
 assert.equal(view.getUint16(0x4090,true),0);assert.equal(memory[0x33aa],0);assert.equal(memory[0x131],1);assert.equal(memory[0x132],1);
 assert.deepEqual(calls,['pause-audio','resume-audio']);
}
console.log('Allocated graphics selection preserves success/cancel behavior and restores audio, callbacks and cursor after dialog failure');
