/** Preserve selected generated evidence only; not a production/database backup. */
import assert from 'node:assert/strict';
import {copyFileSync,constants,existsSync,lstatSync,mkdirSync,readdirSync,readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {join,basename,dirname,isAbsolute,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const [destination,...sources]=process.argv.slice(2);
assert.ok(destination&&isAbsolute(destination)&&!existsSync(destination)&&sources.length>0);
const target=join(realpathSync(dirname(resolve(destination))),basename(destination)),checkout=realpathSync(execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim()),pub=realpathSync('public');
assert.ok(target!==checkout&&!target.startsWith(checkout+'/')&&target!==pub&&!target.startsWith(pub+'/'));
assert.equal(new Set(sources.map(path=>basename(path))).size,sources.length,'Ambiguous source folder names');
const hash=path=>createHash('sha256').update(readFileSync(path)).digest('hex'),entries=[];
for(const source of sources){
 assert.ok(isAbsolute(source)&&lstatSync(source).isDirectory()&&!lstatSync(source).isSymbolicLink());
 const names=readdirSync(source).sort();assert.ok(names.includes('manifest.json'));
 for(const name of names){
  const path=join(source,name);assert.ok(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());
  assert.ok(/\.(wav|json)$/.test(name),'Unexpected evidence file');
  entries.push({source:path,path:join('files',basename(source),name),bytes:lstatSync(path).size,sha256:hash(path)});
 }
}
mkdirSync(target);
for(const entry of entries){
 const folder=join(target,'files',basename(dirname(entry.source)));mkdirSync(folder,{recursive:true});
 const output=join(target,entry.path);copyFileSync(entry.source,output,constants.COPYFILE_EXCL);
 assert.equal(hash(output),entry.sha256);assert.equal(hash(entry.source),entry.sha256,'Evidence changed during preservation');
}
const manifest={createdAt:new Date().toISOString(),fileCount:entries.length,totalBytes:entries.reduce((sum,e)=>sum+e.bytes,0),entries,allCopiedChecksumsVerified:true,renderedLayerInputsIncluded:false,originalSourceStemsIncluded:false,productionDatabaseIncluded:false,approvedForGame:false,scope:'Selected rendered trial outputs, manifests and original reference captures only; linked external layer/stem files are not a complete restore set'};
writeFileSync(join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...manifest,entries:undefined}));
