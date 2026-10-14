import assert from 'node:assert/strict';
import {createMs91RepaintState} from '../lib/game/ms91-repaint-state.ts';
import type {Ms91Rectangle} from '../lib/game/ms91-rectangle-list.ts';
const full:Ms91Rectangle=[0,320,0,200],empty:Ms91Rectangle=[320,0,200,0],clip:Ms91Rectangle=[0,320,0,120];
const regions=Array.from({length:15},()=>[...empty] as Ms91Rectangle);regions[5]=[0,320,0,20];
const before=structuredClone(regions),state=createMs91RepaintState(full,empty),options={enabled:true,fullRedraw:false,pageFlipping:false,detail:0};
const first=state.prepare(regions,clip,10,options);assert.equal(first.flags[5],3);
// Preparing but not presenting cannot change retained state.
assert.equal(state.prepare(regions,clip,10,options).flags[5],3);first.commit();assert.throws(()=>first.commit(),/already/);
assert.equal(state.prepare(regions,clip,10,options).flags[5],0);assert.equal(state.prepare(regions,clip,11,options).flags[5],3);
assert.equal(state.prepare(regions,clip,11,{...options,detail:4}).flags[5],0);
assert.deepEqual(state.prepare(regions,clip,11,{...options,fullRedraw:true}).presentation,[full]);
assert.deepEqual(state.prepare(regions,clip,11,{...options,enabled:false}).presentation,[clip]);
const flip=state.prepare(regions,clip,11,{...options,pageFlipping:true});assert.deepEqual(flip.presentation,[]);flip.commit();assert.equal(state.prepare(regions,clip,11,options).flags[5],3);
state.reset();assert.equal(state.prepare(regions,clip,10,options).flags[5],3);assert.deepEqual(regions,before);
console.log('MS91 renderer-owned repaint state: commit timing, heading/detail suppression, reset and presentation exceptions passed');
