import assert from 'node:assert/strict';
import {expandEffectTimers,splitEffectTimers,createEffectTimerBridge} from '../lib/game/effect-timer-extension.ts';
import {startEffect} from '../lib/game/effect-start.ts';
const canonical=Array.from({length:24},(_,i)=>Uint8Array.from({length:72},(_,j)=>(i*73+j)&255));
const extra=Uint8Array.from({length:96},(_,i)=>i+1),before=canonical.map(t=>t.slice()),extraBefore=extra.slice();
const full=expandEffectTimers(canonical,extra),split=splitEffectTimers(full);
assert.deepEqual(split,{canonical,extra});
const header=new Uint8Array(12);header[5]=1;
for(let owner=16;owner<24;owner++){
 const started=startEffect({physicsEngine:'ms-1991',enabled:true,master:127,volume:100,priority:64,requested:owner,headerOffset:100,headerSegment:0x6000,header,timers:full,busy:Array(24).fill(0),lastNotes:new Uint8Array(24),markers:new Uint8Array(24)});
 const saved=splitEffectTimers(started.timers),restored=expandEffectTimers(saved.canonical,saved.extra);
 assert.deepEqual(restored,started.timers,'All fields survive adapter roundtrip');
 assert.deepEqual(Array.from(saved.extra.subarray(owner*4,owner*4+4)),[0,0,0,0]);
 for(let i=0;i<24;i++)if(i!==owner)assert.deepEqual(restored[i],full[i],'Other owners preserved');
}
assert.deepEqual(canonical,before);assert.deepEqual(extra,extraBefore);
assert.throws(()=>expandEffectTimers(canonical,new Uint8Array(95)),/Incomplete/);
assert.throws(()=>splitEffectTimers(canonical),/Incomplete/);
console.log('PASS lossless24-slot extended timer codec, all8 effect-start resets and source/neighbor preservation');
const bridge=createEffectTimerBridge('ms-1991');
let memory={timers:canonical.map(t=>t.slice())};
let state=bridge.read(memory);state.timers[17][75]=123;
bridge.write(state,value=>{assert.ok(value.timers.every(t=>t.length===72));memory=value;});
assert.equal(bridge.read(memory).timers[17][75],123,'Extension survives independently recreated operations');
state=bridge.read(memory);state.timers[17][75]=88;
assert.throws(()=>bridge.write(state,()=>{throw Error('commit failed');}),/commit failed/);
assert.equal(bridge.read(memory).timers[17][75],123,'Failed commit preserves prior extension');
assert.equal(createEffectTimerBridge('ms-1991').read(memory).timers[17][75],0,'New allocated owner does not inherit old extension');
const legacyBridge=createEffectTimerBridge('ms-1990');assert.equal(legacyBridge.read(memory),memory);
