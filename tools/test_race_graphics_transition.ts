import {test} from 'node:test';
import assert from 'node:assert/strict';
import {raceGraphicsTransition} from '../lib/game/race-graphics-transition.ts';

await test('enhanced results-to-replay handoff holds the existing frame until the new scene is ready',()=>{
 assert.equal(raceGraphicsTransition(true,false,false),'hold');
 assert.equal(raceGraphicsTransition(true,true,false),'enhanced');
});

await test('native graphics remain available when selected or when enhanced scene preparation fails',()=>{
 assert.equal(raceGraphicsTransition(false,false,false),'original');
 assert.equal(raceGraphicsTransition(false,true,false),'original');
 assert.equal(raceGraphicsTransition(true,false,true),'original');
 assert.equal(raceGraphicsTransition(true,true,true),'original');
});
