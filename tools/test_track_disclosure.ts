import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('track disclosures start collapsed and contain every leaderboard section',()=>{
 const source=readFileSync(new URL('../app/high-scores/TrackLeaderboard.tsx',import.meta.url),'utf8');
 assert.match(source,/return <details ref=\{trackPanel\} className="scores-board"/);
 assert.doesNotMatch(source,/<details ref=\{trackPanel\}[^>]*\bopen(?:=|\s|>)/);
 const summaryEnd=source.indexOf('</summary>');
 for(const section of ['scores-car-records','scores-ranking-controls','scores-table-wrap','scores-expand','<footer>'])assert.ok(source.indexOf(section)>summaryEnd,section+' belongs below the clickable header');
 assert.match(source,/if\(query\.trim\(\)&&trackPanel\.current\)trackPanel\.current\.open=true/);
 assert.match(source,/\},\[query\]\)/,'Refreshes must not reopen manually closed panels');
});
