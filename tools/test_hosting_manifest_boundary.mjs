import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';

const manifest=JSON.parse(readFileSync('.openai/hosting.json','utf8'));
assert.equal(manifest.project_id,'appgprj_6a9c0ea623e081919fef2096f118dd79','Preserve the existing Site identity');
for(const key of Object.keys(manifest))assert.ok(['project_id','static','d1','r2','capabilities','plugins','connectors'].includes(key),'Review unexpected hosting fields before source publication');
function ignored(path){
 const result=spawnSync('git',['check-ignore','--no-index','--quiet',path]);
 assert.ok(result.status===0||result.status===1,'Git ignore check must complete');
 return result.status===0;
}
assert.equal(execFileSync('git',['ls-files','--error-unmatch','.openai/hosting.json'],{encoding:'utf8'}).trim(),'.openai/hosting.json','Hosting manifest must remain tracked even though other local hosting state is ignored');
for(const path of ['.openai/credential.json','.openai/local-state.json','.openai/nested/token.json','.env','.env.local','local-assets/private.rom'])assert.equal(ignored(path),true,'Local state must remain excluded: '+path);
console.log('Existing hosting manifest remains tracked; local credentials, environment files and private assets remain ignored');
