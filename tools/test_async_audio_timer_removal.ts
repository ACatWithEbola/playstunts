import assert from 'node:assert/strict';
import {removeOriginalAudioTimer,removeOriginalAudioTimerAsync} from '../lib/game/remove-audio-timer.ts';
const d=0x2d1a0;
for(const mode of ['mcga','cga','tandy','ega'] as const){
 const low={mcga:0,cga:0x5da,tandy:0x616,ega:0x462}[mode],memory=new Uint8Array(0x100000),view=new DataView(memory.buffer),records=[0x618e,0x618e+76];
 for(const [index,at]of records.entries()){memory[d+at+low]=1;view.setUint16(d+at+low+2,index+7,true);}
 view.setUint16(d+0x4092,0x3fd,true);view.setUint16(d+0x4094,0x18fd,true);view.setUint32(d+0x4096,0x12345678,true);
 const sync=memory.slice(),expected:number[]=[];
 removeOriginalAudioTimer({memory:()=>sync,stopEffect:handle=>{expected.push(handle);}},d,mode);
 let entered:()=>void=()=>{},finish:()=>void=()=>{};const reached=new Promise<void>(resolve=>{entered=resolve;}),calls:number[]=[];
 const removal=removeOriginalAudioTimerAsync({memory:()=>memory,async stopEffect(handle){calls.push(handle);if(calls.length===1){entered();await new Promise<void>(resolve=>{finish=resolve;});}}},d,mode);
 await reached;assert.equal(memory[d+records[0]+low],1);assert.equal(view.getUint16(d+0x4092,true),0x3fd,'Timer remains registered until all stops delivered');assert.deepEqual(calls,[7]);finish();await removal;
 assert.deepEqual(calls,expected);assert.deepEqual(memory,sync,'Async removal exactly matches complete synchronous memory');
 const failed=memory.slice();failed[d+records[0]+low]=1;new DataView(failed.buffer).setUint32(d+0x4092,0x18fd03fd,true);
 await assert.rejects(removeOriginalAudioTimerAsync({memory:()=>failed,async stopEffect(){throw Error('Device stop failed');}},d,mode),/Device stop failed/);
 assert.equal(failed[d+records[0]+low],1);assert.equal(new DataView(failed.buffer).getUint32(d+0x4092,true),0x18fd03fd);
}
console.log('All four layouts retain complete synchronous removal memory; async stops finish before record/timer release and failure retains ownership');
