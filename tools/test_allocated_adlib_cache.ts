import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {createAllocatedRaceAudio} from '../lib/game/allocated-race-audio.ts';
import {initializeMs91AdlibRegisterCache} from '../lib/game/versioned-adlib-register-writes.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');
const runtime=await createNativeManualRaceRuntime(fixtureData,{configuration:Array.from(bytes.subarray(0,24)),track:Array.from(bytes.subarray(24,0x722)),name:'ADCache',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer),driver=v.getUint16(d+0x4dde,true),base=driver*16,handle=v.getUint16(d+0x8016,true);
// Isolated adapter probe: modern cache/layout staged explicitly, not full startup.
memory.set(memory.slice(base+0x957,base+0x960),base+0x974);initializeMs91AdlibRegisterCache(memory.subarray(base,base+0xa7d));
const audio=createAllocatedRaceAudio(()=>memory,d,driver,'ms-1991');audio.start(handle);audio.crash(handle);
for(let i=0;i<100;i++){
 const writes=audio.tick();
 for(const [register,value] of new Map(writes.map(([register,value])=>[register,value])))assert.equal(memory[base+0x97d+register],value);
}
assert.equal(memory[d+0x4e6a],0);
console.log('Allocated AdLib modern adapter consumes staged layout/cache, commits emitted registers and completes100 callbacks; full startup not covered');
