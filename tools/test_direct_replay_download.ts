import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('leaderboard offers guarded downloads outside details and suppresses redundant valid-run explanation',()=>{
 const s=readFileSync(new URL('../app/high-scores/TrackLeaderboard.tsx',import.meta.url),'utf8');
 assert.match(s,/import ReplayDownload from '\.\/ScoreReplayDownload'/);
 assert.match(s,/<\/details>\{score\.replay&&<ReplayDownload id=\{score\.id\} className="scores-replay-dot"\/>\}/);
 assert.doesNotMatch(s,/<a[^>]*href=\{'\/api\/replays/,'Raw links must not bypass recorded-engine compatibility notice');
 const wrapper=readFileSync(new URL('../app/high-scores/ScoreReplayDownload.tsx',import.meta.url),'utf8');
 assert.match(wrapper,/import ReplayDownload from '\.\.\/ReplayDownload'/);
 assert.match(wrapper,/<ReplayDownload \{\.\.\.props\}\/>/);
 assert.match(s,/score.routeAssessment!=='full_route'&&<p className="scores-route-note">/);
 assert.doesNotMatch(s,/text=\{"REPLAY"\}/);
});
