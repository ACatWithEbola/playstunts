import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('all four library lists render only the requested number of entries',()=>{
 const saves=read('app/SaveBackupPanel.tsx'),tracks=read('app/SharedTracksPanel.tsx'),replays=read('app/SharedReplaysPanel.tsx');
 assert.match(saves,/downloads\.slice\(0,visible\)\.map/);
 assert.match(tracks,/tracks\.slice\(0,visible\)\.map/);
 assert.match(replays,/mine\.slice\(0,mineVisible\)\.map/);
 assert.match(replays,/replays\.slice\(0,sharedVisible\)\.map/);
 for(const source of [saves,tracks,replays])assert.match(source,/useState\(10\)/);
 assert.equal((replays.match(/<ListPagination /g)||[]).length,2);
});
test('remote lists reveal cached rows before fetching and only expand after successful fetches',()=>{
 assert.match(read('app/SharedTracksPanel.tsx'),/if\(visible>=tracks\.length\)\{if\(await load\(true\)\)/);
 assert.match(read('app/SharedReplaysPanel.tsx'),/if\(sharedVisible>=replays\.length\)\{if\(await load\(true\)\)/);
 assert.match(read('app/SharedReplaysPanel.tsx'),/if\(!append\)setSharedVisible\(10\)/);
 assert.match(read('app/SharedTracksPanel.tsx'),/if\(!more\)setVisible\(10\)/);
});
test('common controls support short lists, unknown remote totals, busy state and resetting to ten',()=>{
 const source=read('app/ListPagination.tsx');
 assert.match(source,/if\(total<=10&&!hasMore\)return null/);
 assert.match(source,/Math\.min\(visible,total\)/);
 assert.match(source,/visible<total\|\|hasMore/);
 assert.match(source,/visible>10/);
 assert.match(source,/disabled=\{busy\}/);
 assert.match(source,/Show 10 more/);assert.match(source,/Show top 10/);
});
