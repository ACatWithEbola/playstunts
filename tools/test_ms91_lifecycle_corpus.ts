/** Explicit external-corpus gate. Missing references are failures, not skips.
 * Reference files are read-only and never copied into deployment assets. */
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const root=process.argv[2];
if(!root)throw Error('Usage: npm run test:ms91-lifecycle -- /absolute/path/to/competition');
const cases=['zct300/25-MAR.RPL','zct300/18-ERI.RPL','zct299/01-ARG.RPL','zct299/20-STB.RPL'];
const paths=cases.map(name=>resolve(root,name));
for(const path of paths)if(!existsSync(path))throw Error('Required lifecycle reference is missing: '+path);
for(const [index,path] of paths.entries()){
 console.log('MS91 lifecycle reference '+cases[index]);
 const result=spawnSync(process.execPath,['tools/test_global_score_native_results.ts'],{cwd:resolve(import.meta.dirname,'..'),env:{...process.env,MS91_RESULT_REPLAY:path},stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)throw Error('Lifecycle reference failed: '+cases[index]);
}
console.log('All four MS91 race/save/backup/restore/download/reload/private-score cases passed');
