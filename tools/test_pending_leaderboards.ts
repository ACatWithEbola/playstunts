import {test} from 'node:test';
import assert from 'node:assert/strict';
import {withPendingTracks,pendingTrackMatches} from '../lib/game/pending-leaderboards.ts';
import type {Leaderboard} from '../lib/server/public-leaderboards.ts';
const pending={trackHash:'b'.repeat(64),track:'HELL666',driver:'PENDING',car:'Porsche Carrera 4',postedAt:2};
test('pending rows never enter ranked arrays or replace an existing verified record',()=>{
 const board={hash:pending.trackHash,name:'HELL666',updatedAt:1,scores:[{id:'verified',ticks:100}],cars:[],categories:{full_route:{scores:[{id:'verified',ticks:100}],cars:[]}}} as unknown as Leaderboard;
 const before=structuredClone(board),result=withPendingTracks([board],[pending],'');
 assert.equal(result.length,1);assert.equal(result[0],board);assert.deepEqual(board,before);
});
test('a new pending track gets only an empty table shell and searches match its driver or exact identity',()=>{
 const before=structuredClone(pending),result=withPendingTracks([],[pending,pending],'pending');assert.equal(result.length,1);assert.equal(result[0].hash,pending.trackHash);
 assert.deepEqual(result[0].scores,[]);assert.deepEqual(result[0].cars,[]);assert.deepEqual(result[0].categories!.full_route.scores,[]);assert.deepEqual(result[0].categories!.shortcuts_detected.scores,[]);
 assert.equal(withPendingTracks([],[pending],'unrelated').length,0);assert.ok(pendingTrackMatches(pending,pending.trackHash.toUpperCase()));assert.deepEqual(pending,before);
 assert.equal(withPendingTracks([],[],'').length,0,'The pending row disappears once the server finishes it');
});
