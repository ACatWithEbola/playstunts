import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('public replay library no longer reads or offers actions on private verified runs',()=>{
 const source=readFileSync(new URL('../app/SharedReplaysPanel.tsx',import.meta.url),'utf8');
 assert.doesNotMatch(source,/Your verified runs|Recheck privately|Share replay|GLOBAL_SCORE_DATABASE|VERIFIED:|stunts-verified-replays/);
 assert.doesNotMatch(source,/indexedDB\.deleteDatabase|\.delete\(|method:'POST'/);
 assert.match(source,/Shared runs/);assert.match(source,/prepareSharedReplayImport/);
 assert.match(source,/replays\.slice\(0,sharedVisible\)/);
});
