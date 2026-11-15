import assert from 'node:assert/strict';
import {createDefaultRouteBypass,DEFAULT_TRACK_HASH} from '../lib/server/default-route-bypass.ts';
const state=(hash=DEFAULT_TRACK_HASH)=>createDefaultRouteBypass(hash);
let a=state();assert.equal(a.result(true),false,'no samples cannot establish a bypass');a.observe([7000*64,0,0]);assert.equal(a.result(false),false,'unfinished race cannot establish a bypass');assert.equal(a.result(true),true);
a.observe([3000*64,0,0]);assert.equal(a.result(true),false,'western route remains eligible');
a=state();a.observe([13000*64,0,0]);assert.equal(a.result(true),false,'eastern route remains eligible');
a=state('other-track');a.observe([7000*64,0,0]);assert.equal(a.result(true),false,'never classify another track by name or geometry');
a=state();a.observe([NaN,0,0]);assert.equal(a.result(true),false,'invalid positions cannot establish a bypass');
console.log('DEFAULT bypass needs an accepted finish and evidence that neither wide route boundary was reached');
