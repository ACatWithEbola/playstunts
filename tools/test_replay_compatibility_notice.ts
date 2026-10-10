import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const component=read('app/ReplayDownload.tsx');
assert.match(component,/event.preventDefault\(\)/);
assert.match(component,/panel.showModal\(\)/);
assert.match(component,/13 December 1990/);
assert.match(component,/link.download=''/);
assert.match(component,/text="OK"/);
assert.match(component,/text="Cancel"/);
for(const file of ['app/high-scores/TrackLeaderboard.tsx','app/high-scores/DriverHistory.tsx','app/SharedReplaysPanel.tsx']){
 assert.match(read(file),/<ReplayDownload /);
 assert.doesNotMatch(read(file),/<a[^>]*href=\{'\/api\/replays/);
}
assert.match(read('app/faq/page.tsx'),/Which game versions can play downloaded replays/);
console.log('Replay compatibility notice checks passed');
