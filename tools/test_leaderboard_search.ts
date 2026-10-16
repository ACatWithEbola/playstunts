import {test} from 'node:test';
import assert from 'node:assert/strict';
import {leaderboardSearch} from '../lib/server/leaderboard-search.ts';
test('track links match exact full content IDs without LIKE patterns',()=>{
 const hash='4F97265080C90791A1AAE2F04DB57A63412077A9F246A39F79DC2126D183B976';
 assert.deepEqual(leaderboardSearch(hash,'label',()=> 'name','{}'),{sql:'s.track_hash=?',params:[hash.toLowerCase()]});
});
test('text searches remain bound and escape wildcard characters',()=>{
 const value=leaderboardSearch('HELL_%','label',()=> 'name','{}');
 assert.equal(value.params.length,6);assert.equal(value.params[1],'%HELL\\_\\%%');
 assert.ok(value.sql.includes('LIKE ?'));assert.ok(!value.sql.includes('HELL'));
});
