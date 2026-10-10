import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('leaderboard offers direct downloads and suppresses redundant valid-run explanation',()=>{
 const s=readFileSync(new URL('../app/high-scores/TrackLeaderboard.tsx',import.meta.url),'utf8');
 assert.match(s,/<a className="scores-replay-dot" href=\{'\/api\/replays\?id='\+score.id\} download>/);
 assert.match(s,/text=\{"Download replay"\}/);
 assert.match(s,/score.routeAssessment!=='full_route'&&<p className="scores-route-note">/);
 assert.doesNotMatch(s,/text=\{"REPLAY"\}/);
});
