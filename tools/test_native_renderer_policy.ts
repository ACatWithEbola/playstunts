import assert from 'node:assert/strict';
import {nativeRendererPolicy,nativeDisplayRendererPolicy} from '../lib/game/native-renderer-policy.ts';
for(const engine of ['ms-1990','ms-1991','bb-1991'] as const){
 assert.deepEqual(nativeRendererPolicy(engine),{});
 assert.deepEqual(nativeDisplayRendererPolicy(engine),{});
 for(const slow of [true,false])if(engine!=='ms-1991')assert.deepEqual(nativeRendererPolicy(engine,slow),{},'Loaded legacy/BB session must ignore future MS91 settings');
}
for(const slow of [false,true]){
 assert.deepEqual(nativeDisplayRendererPolicy('ms-1990',slow),{});
 assert.deepEqual(nativeDisplayRendererPolicy('bb-1991',slow),{});
 assert.deepEqual(nativeDisplayRendererPolicy('ms-1991',slow),{...nativeRendererPolicy('ms-1991',slow),experimentalMs91WindowCopy:slow});
}
for(const slow of [true,false])assert.deepEqual(nativeRendererPolicy('ms-1991',slow),{experimentalMs91RegionFlags:true,experimentalMs91SlowVideoManagement:slow,experimentalMs91PartialBackground:slow,experimentalMs91SelectiveCopy:slow});
assert.throws(()=>nativeRendererPolicy('unknown' as never,true));assert.throws(()=>nativeRendererPolicy('ms-1991',1 as never));
console.log('Experimental renderer routing follows loaded session identity, preserves omitted/default and legacy policies, and rejects invalid MS91 settings');
