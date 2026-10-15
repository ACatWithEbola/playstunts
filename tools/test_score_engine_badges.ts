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
const named=(id:string,name:string,ticks:number,engine?:'ms-1990'|'ms-1991',car='PMIN',route='full_route'):PublicScoreRow=>{
 const record=Array(52).fill(0);[...name].forEach((c,i)=>record[i]=c.charCodeAt(0));
 return {...row,id,ticks,record:JSON.stringify(record),physics_engine:engine,car_code:car,route_assessment:route};
};
const mixed=[named('old','Sven',120),named('new',' SVEN ',100,'ms-1991'),named('old-win','Alice',90),named('new-loss','alice',130,'ms-1991'),named('car','Sven',140,undefined,'COUN'),named('exploit','Sven',80,'ms-1991','PMIN','shortcuts_detected')];
const snapshot=JSON.stringify(mixed),combined=publicLeaderboards(mixed,new Map())[0];
assert.deepEqual(combined.categories!.full_route.scores.map(s=>[s.id,s.physicsEngine]),[['old-win','ms-1990'],['new','ms-1991']]);
assert.deepEqual(combined.categories!.full_route.cars.find(c=>c.code==='PMIN')!.scores.map(s=>s.id),['old-win','new']);
assert.equal(combined.categories!.full_route.cars.find(c=>c.code==='COUN')!.scores[0].physicsEngine,'ms-1990');
assert.equal(combined.categories!.shortcuts_detected.scores[0].id,'exploit');
assert.equal(JSON.stringify(mixed),snapshot,'Combined ranking must not modify recorded data');
const tied=publicLeaderboards([{...named('b','Tie',100,'ms-1991'),created_at:2},{...named('a','tie',100),created_at:1}],new Map())[0];
assert.equal(tied.scores[0].physicsEngine,'ms-1990','Ties retain the earliest result, not the preferred edition');
console.log('Engine-filtered score labels preserve source records and legacy defaults');
