import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicScoreName} from '../lib/game/public-score-name.ts';
import {publicLeaderboards,type PublicScoreRow} from '../lib/server/public-leaderboards.ts';
test('public names mask common profanity and simple disguises without innocent substring matches',()=>{
 for(const name of ['FUCK','f.u.c.k','F U C K','F4GG0T','shit','SHITHEAD','BULLSHIT','ASSHOLE','faen'])assert.equal(publicScoreName(name),'••••',name);
 for(const name of ['Scunthorpe','Dickinson','Dick','Assistant','Marco'])assert.equal(publicScoreName(name),name);
});
test('directory groups exact tracks, preserves times and metadata, and censors public names',()=>{
 const record=Array(52).fill(0);Array.from('FUCK',c=>c.charCodeAt(0)).forEach((n,i)=>record[i]=n);Array.from('Porsche March Indy',c=>c.charCodeAt(0)).forEach((n,i)=>record[17+i]=n);
 const row:PublicScoreRow={id:'one',track_hash:'hash1',car_code:'PMIN',ticks:1234,record:JSON.stringify(record),created_at:100,track_name:'CUSTOM',has_replay:1};
 const boards=publicLeaderboards([row,{...row,id:'two',ticks:1200},{...row,id:'three',track_hash:'hash2',has_replay:0}],new Map([['hash1','DEFAULT']]));
 assert.equal(boards.length,2);const board=boards.find(b=>b.hash==='hash1')!;assert.equal(board.name,'DEFAULT');assert.deepEqual(board.scores.map(s=>s.ticks),[1200,1234]);assert.equal(board.scores[0].driver,'••••');assert.equal(board.scores[0].car,'Porsche March Indy');assert.equal(board.scores[0].replay,true);assert.equal(board.scores[0].postedAt,100);
});
