/** Restore a trusted locally created source checkpoint into a new temporary
 * directory. Never extract over the active checkout or follow asset symlinks. */
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,lstatSync,readlinkSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const directory=process.argv[2];
if(!directory||!isAbsolute(directory))throw Error('Provide an absolute source checkpoint directory');
const manifest=JSON.parse(readFileSync(join(directory,'manifest.json'),'utf8'));
assert.equal(manifest.productionDatabaseIncluded,false);
assert.equal(manifest.archive,'source.tar.gz');
const archive=join(directory,manifest.archive),digest=createHash('sha256').update(readFileSync(archive)).digest('hex');
assert.equal(digest,manifest.sha256,'Checkpoint checksum mismatch');
const names=execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).trim().split('\n');
for(const name of names)assert.ok(!isAbsolute(name)&&!name.split('/').includes('..'),'Unsafe archive path');
const destination=mkdtempSync(join(tmpdir(),'playstunts-source-restore-'));
execFileSync('tar',['-xzf',archive,'-C',destination]);
const required=['package.json','lib/game/native-race-session.ts','lib/game/allocated-replay-load.ts','lib/game/ms91-demo-resource.json','tools/test_legacy_deferred_replay_seek.ts'];
for(const name of required){assert.ok(names.includes(name),'Missing required source: '+name);assert.ok(lstatSync(join(destination,name)).isFile());assert.ok(readFileSync(join(destination,name)).length>0);}
for(const name of manifest.symlinks)assert.ok(lstatSync(join(destination,name)).isSymbolicLink(),'Asset link must remain a link');
let completeEntriesVerified=0;
if(manifest.entries){
 assert.equal(manifest.entries.length,manifest.fileCount);
 assert.equal(new Set(manifest.entries.map(entry=>entry.path)).size,manifest.fileCount);
 assert.deepEqual([...new Set(names)].sort(),manifest.entries.map(entry=>entry.path).sort(),'Archive inventory differs from manifest');
 for(const entry of manifest.entries){
  const path=join(destination,entry.path),stat=lstatSync(path);
  if(entry.type==='symlink'){assert.ok(stat.isSymbolicLink());assert.equal(readlinkSync(path),entry.target);}
  else{
   assert.equal(entry.type,'file');assert.ok(stat.isFile());const bytes=readFileSync(path);
   assert.equal(bytes.length,entry.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256,'Restored content differs: '+entry.path);
  }
  completeEntriesVerified++;
 }
}
console.log(JSON.stringify({checkpoint:directory,restoredSource:destination,sha256:digest,requiredFilesVerified:required.length,completeEntriesVerified,completeInventoryVerified:completeEntriesVerified===manifest.fileCount,productionDatabaseIncluded:false,externalAssetsFollowed:false}));
