/** Required-path, read-only independent C reference corpus. Not a DOS oracle. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.argv[2];
assert.ok(root&&isAbsolute(root),'Provide the absolute independent reference directory');
for(let opponent=1;opponent<=6;opponent++){
 const name=opponent===1?'OPPAUDI':`AUDIOPP${opponent}`;
 const replay=join(root,name+'.RPL'),dump=join(root,name+'.BNI');
 const before=readFileSync(replay),reference=readFileSync(dump);
 assert.equal(before[6],opponent,'Wrong opponent fixture');
 const result=spawnSync(process.execPath,['tools/compare_external_replay.ts',replay,dump,'ms-1991'],{encoding:'utf8'});
 process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 assert.ifError(result.error);assert.equal(result.status,0,`Opponent ${opponent} differs from independent C reference`);
 assert.deepEqual(readFileSync(replay),before,'Source recording changed');
 assert.deepEqual(readFileSync(dump),reference,'Independent reference changed');
}
console.log('All six opponent profiles match the independent C Audi race; original DOS whole-race verification remains separate');
