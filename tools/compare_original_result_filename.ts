import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {buildOriginalFilePath} from '../lib/game/original-file-path.ts';
const [legacy,modern,libraries]=process.argv.slice(2);assert.ok(legacy&&modern&&libraries);
const run=spawnSync('python3',['tools/check_original_result_filename.py',legacy,modern,'--libraries',libraries],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);
const capture=JSON.parse(run.stdout);assert.equal(capture.cases.length,72);assert.equal(capture.sourcesUnchanged,true);
for(const row of capture.cases){
 const memory=new Uint8Array(65536);
 for(const [at,text] of [[0x1000,row.directory??''],[0x1100,row.name],[0x1200,row.extension],[0x337b,'\\']] as const)memory.set(new TextEncoder().encode(text+'\0'),at);
 buildOriginalFilePath(memory,0,row.directory===null?0:0x1000,0x1100,0x1200,0x2000,0xeffe);
 const output=Buffer.from(memory.subarray(0x2000,0x2100)).toString('ascii').split('\0')[0];
 assert.equal(output,row.output,JSON.stringify(row));
}
console.log(JSON.stringify({originalFilenameCases:72,bothEnginesMatchNative:true,noFileAccess:true,pass:true}));
