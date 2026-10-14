import assert from 'node:assert/strict';
import {selectAllocatedMouseControl,selectAllocatedGraphicsLevel,selectAllocatedMs91Graphics} from '../lib/game/allocated-mouse-selection.ts';
import {saveNativeReplay} from '../lib/game/native-replay-save.ts';

const deferred=()=>{let resolve!:()=>void;const promise=new Promise<void>(r=>resolve=r);return {promise,resolve};};
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
for(const kind of ['mouse','legacy','modern'] as const){
 const memory=new Uint8Array(65536);memory[0x132]=1;
 const pause=deferred(),resume=deferred();const events:string[]=[];
 const host={memory:()=>memory,audio:(operation:string)=>{events.push(operation);return operation==='pause-audio'?pause.promise:resume.promise;},dialog:async()=>{events.push('dialog');return -1;},hideCursor:()=>events.push('hide')};
 const run=()=>kind==='mouse'?selectAllocatedMouseControl(host,0):kind==='legacy'?selectAllocatedGraphicsLevel(host,0):selectAllocatedMs91Graphics(host,0,{graphics:0,slowVideoManagement:false,configuredFramesPerSecond:20});
 const pending=run();await flush();assert.deepEqual(events,['pause-audio']);assert.equal(memory[0x33aa],1);
 pause.resolve();await flush();assert.deepEqual(events,['pause-audio','dialog','resume-audio']);assert.equal(memory[0x33aa],1);
 resume.resolve();await pending;assert.equal(memory[0x33aa],0);assert.equal(new DataView(memory.buffer).getUint16(0x4090,true),0);
 const failing={...host,audio:async()=>{},dialog:async()=>{throw Error('dialog failed');}};
 await assert.rejects(kind==='mouse'?selectAllocatedMouseControl(failing,0):kind==='legacy'?selectAllocatedGraphicsLevel(failing,0):selectAllocatedMs91Graphics(failing,0,{graphics:0,slowVideoManagement:false,configuredFramesPerSecond:20}),/dialog failed/);
 assert.equal(memory[0x33aa],0);assert.equal(memory[0x4090],0);
}
const pause=deferred();let edited=false,writes=0;
const host={pauseAudio:()=>pause.promise,editName:async()=>{edited=true;return false;},buildPath:()=>{},exists:async()=>false,dialog:async()=>0,write:async()=>{writes++;return 0;}};
const pending=saveNativeReplay(host);await flush();assert.equal(edited,false);pause.resolve();assert.equal(await pending,false);assert.equal(edited,true);assert.equal(writes,0);
edited=false;await assert.rejects(saveNativeReplay({...host,pauseAudio:async()=>{throw Error('pause failed');}}),/pause failed/);assert.equal(edited,false);assert.equal(writes,0);
console.log('Async settings and replay-save audio boundaries passed');
