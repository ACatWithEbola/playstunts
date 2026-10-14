import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const [slow,root]=process.argv.slice(2);
if(!slow||!root)throw Error('Provide original MS91 slow replay and four-reference competition root');
assert.ok(existsSync(slow),'Original slow replay is required');
const references=['zct300/25-MAR.RPL','zct300/18-ERI.RPL','zct299/01-ARG.RPL','zct299/20-STB.RPL'];
for(const name of references)assert.ok(existsSync(resolve(root,name)),'Required reference missing: '+name);
for(const name of references){
 console.log('Allocated replay growth/switch reference: '+name);
 const result=spawnSync(process.execPath,['tools/test_ms91_allocated_slow_load.ts',resolve(slow),resolve(root,name)],{cwd:resolve(import.meta.dirname,'..'),stdio:'inherit'});
 if(result.error)throw result.error;
 assert.equal(result.status,0,'Allocated reload failed for '+name);
}
console.log('All four allocated growth/failure-recovery/cadence/engine reload cases pass');
