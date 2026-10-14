/** Read-only asset source; create and restore-check a separate new backup. */
import assert from 'node:assert/strict';
import {realpathSync,readdirSync,lstatSync,readFileSync,mkdirSync,writeFileSync,existsSync,mkdtempSync} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const destination=process.argv[2];assert.ok(destination&&isAbsolute(destination),'Supply a new absolute backup directory');
const source=realpathSync('public'),target=resolve(destination);
assert.ok(target!==source&&!target.startsWith(source+'/')&&!existsSync(target),'Refuse existing/source destination');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'),files=[];
function collect(relative=''){
 for(const entry of readdirSync(join(source,relative),{withFileTypes:true})){
  const path=relative?relative+'/'+entry.name:entry.name;
  assert.ok(!entry.isSymbolicLink(),'Review nested asset symlink: '+path);
  assert.ok(!/(^|\/)(\.env(?:\..*)?|credentials[^/]*|id_rsa|id_ed25519)$/.test(path),'Unexpected credential filename');
  if(entry.isDirectory())collect(path);
  else if(entry.isFile()){const bytes=readFileSync(join(source,path));files.push({path,bytes:bytes.length,sha256:sha(bytes)});}
  else throw Error('Unsupported asset entry: '+path);
 }
}
collect();assert.ok(files.length>0);files.sort((a,b)=>a.path.localeCompare(b.path));
mkdirSync(target);const archive=join(target,'public-assets.tar.gz');
execFileSync('tar',['-czf',archive,'--null','-T','-'],{cwd:source,input:Buffer.from(files.map(f=>f.path).join('\0')+'\0')});
const restored=mkdtempSync(join(tmpdir(),'playstunts-assets-restore-'));
execFileSync('tar',['-xzf',archive,'-C',restored]);
for(const file of files){
 assert.ok(lstatSync(join(restored,file.path)).isFile());
 assert.equal(sha(readFileSync(join(restored,file.path))),file.sha256,'Restored '+file.path);
 assert.equal(sha(readFileSync(join(source,file.path))),file.sha256,'Source changed '+file.path);
}
const manifest={source,createdAt:new Date().toISOString(),archive:'public-assets.tar.gz',archiveSha256:sha(readFileSync(archive)),fileCount:files.length,totalBytes:files.reduce((n,f)=>n+f.bytes,0),restored,productionDatabaseIncluded:false,files};
writeFileSync(join(target,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...manifest,files:undefined}));
