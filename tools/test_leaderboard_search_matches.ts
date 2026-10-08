import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scoreMatches,searchRanking,searchVisible} from '../app/high-scores/search-matches.ts';
import type {Leaderboard,LeaderboardScore} from '../lib/server/public-leaderboards.ts';
const score=(driver:string,car='Porsche/March INDY'):LeaderboardScore=>({id:driver,driver,car,carCode:'PMIN',ticks:1200,opponent:'',opponentAhead:false,postedAt:0,replay:true});
test('search matches names and cars without case sensitivity',()=>{
 assert.equal(scoreMatches(score('Sven'),' sVeN '),true);
 assert.equal(scoreMatches(score('Sven'),'indy'),true);
 assert.equal(scoreMatches(score('Sven'),'PMIN'),true);
 assert.equal(scoreMatches(score('Sven'),''),false);
});
test('matching rows beyond ten are revealed without changing rank order',()=>{
 const scores=Array.from({length:25},(_,i)=>score(i===21?'Sven':'Driver '+i));
 assert.equal(searchVisible(scores,'Sven'),22);
 assert.equal(searchVisible(scores,''),10);
 assert.equal(scores[21].driver,'Sven');
});
test('search selects a car ranking when the overall best run hides the matching car',()=>{
 const board={categories:{full_route:{scores:[score('Marco')],cars:[{code:'AUDI',name:'Audi',scores:[score('Sven','Audi Quattro Sport')]}]}}} as Leaderboard;
 assert.deepEqual(searchRanking(board,'Audi'),{category:'full_route',mode:'car',code:'AUDI'});
 assert.deepEqual(searchRanking(board,'Marco'),{category:'full_route',mode:'overall',code:''});
 assert.equal(searchRanking(board,''),null);
});
