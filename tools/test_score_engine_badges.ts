import assert from 'node:assert/strict';
import {publicLeaderboards,type PublicScoreRow} from '../lib/server/public-leaderboards.ts';
const row:PublicScoreRow={id:'fixture',track_hash:'track',car_code:'PMIN',ticks:100,record:JSON.stringify(Array(52).fill(0)),created_at:1,track_name:'TEST',has_replay:1,route_assessment:'full_route'};
const before=JSON.stringify(row);
for(const engine of ['ms-1990','ms-1991','bb-1991'] as const){
 const board=publicLeaderboards([row],new Map(),engine)[0];
 assert.equal(board.scores[0].physicsEngine,engine);
 assert.equal(board.cars[0].scores[0].physicsEngine,engine);
 assert.equal(board.categories!.full_route.scores[0].physicsEngine,engine);
 assert.equal(board.scores[0].ticks,100);
}
assert.equal(publicLeaderboards([row],new Map())[0].scores[0].physicsEngine,'ms-1990');
assert.equal(JSON.stringify(row),before);
console.log('Engine-filtered score labels preserve source records and legacy defaults');
