/** Explicit local source snapshot. Does not deploy, modify Git or back up DB data.
 * Usage: node tools/backup_compatibility_source.mjs ABSOLUTE_NEW_DIRECTORY
 */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,existsSync,lstatSync,readdirSync,readlinkSync} from 'node:fs';
import {resolve,isAbsolute,join} from 'node:path';
import {createHash} from 'node:crypto';
const destination=process.argv[2];
if(!destination||!isAbsolute(destination))throw Error('Supply an absolute new backup directory');
const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
const target=resolve(destination);
if(target===root||target.startsWith(root+'/'))throw Error('Backup destination must be outside the checkout');
if(existsSync(target))throw Error('Destination already exists; refusing to overwrite');
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root});
// Development source may be ignored by global Git rules. Include explicit
// source roots independently, but never follow asset/dependency symlinks.
const extra=[];
const sourceExtensions=/\.(?:ts|tsx|js|mjs|cjs|json|py|md|css|html|c|h|sh)$/i;
function collect(directory){
 if(!existsSync(join(root,directory)))return;
 for(const entry of readdirSync(join(root,directory),{withFileTypes:true})){
  const name=directory+'/'+entry.name;
  if(entry.isSymbolicLink())continue;
  if(entry.isDirectory()){if(!['node_modules','__pycache__','.git','dist','.cache'].includes(entry.name))collect(name);}
  else if(entry.isFile()&&sourceExtensions.test(entry.name))extra.push(name);
 }
}
for(const directory of ['lib','tools','app','docs'])collect(directory);
// The globally ignored public link is required by imports and runtime assets.
// Archive the link itself, never its externally owned contents.
if(existsSync(join(root,'public'))&&lstatSync(join(root,'public')).isSymbolicLink())extra.push('public');
const names=[...new Set([...files.toString().split('\0').filter(Boolean),...extra])].filter(name=>existsSync(join(root,name)));
if(names.some(name=>/(^|\/)(\.env(?:\..*)?|credentials[^/]*|id_rsa|id_ed25519)$/.test(name)))throw Error('Potential credential file in source list; review before backup');
mkdirSync(target,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const entries=names.map(name=>{
 const path=join(root,name),stat=lstatSync(path);
 if(stat.isSymbolicLink())return {path:name,type:'symlink',target:readlinkSync(path)};
 if(!stat.isFile())throw Error('Unsupported source entry: '+name);
 const bytes=readFileSync(path);return {path:name,type:'file',bytes:bytes.length,sha256:hash(bytes)};
});
const archive=join(target,'source.tar.gz');
execFileSync('tar',['-czf',archive,'--null','-T','-'],{cwd:root,input:Buffer.from(names.join('\0')+'\0')});
const sha256=createHash('sha256').update(readFileSync(archive)).digest('hex');
const symlinks=names.filter(name=>lstatSync(join(root,name)).isSymbolicLink());
const generatedOriginalResources=JSON.parse(readFileSync(join(root,'docs/ms91-resource-recipes.json'))).outputs.map(row=>'lib/game/'+row.path).filter(name=>names.includes(name));
for(const entry of entries){
 const path=join(root,entry.path);
 if(entry.type==='symlink'){if(readlinkSync(path)!==entry.target)throw Error('Source link changed during backup: '+entry.path);}
 else if(hash(readFileSync(path))!==entry.sha256)throw Error('Source changed during backup: '+entry.path);
}
const metadata={createdAt:new Date().toISOString(),checkout:root,commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),archive:'source.tar.gz',sha256,fileCount:names.length,entries,explicitSourceRoots:['lib','tools','app','docs'],symlinks,productionDatabaseIncluded:false,forPrivateRecoveryOnly:true,generatedOriginalResources};
writeFileSync(join(target,'manifest.json'),JSON.stringify(metadata,null,2)+'\n');
writeFileSync(join(target,'PRIVATE-RECOVERY-NOTICE.txt'),'Private local recovery checkpoint, not a GitHub source publication archive.\nIncludes generated original-game modules when present:\n'+generatedOriginalResources.join('\n')+'\nUse the source publication guard and local preparation workflow for public source.\n');
writeFileSync(join(target,'RESTORE.txt'),`Verify source.tar.gz against SHA-256 ${sha256}.\nExtract into a NEW empty checkout directory, never over an active project.\nThis captures tracked and non-ignored source plus explicit lib/tools/app/docs source files, including source ignored by global Git rules and uncommitted changes.\nDependencies, credentials, production scores and replays are NOT included.\nSymlinks retain their original targets: ${symlinks.join(', ')||'none'}. Preserve external asset directories separately.\nFor rollback after new-engine records exist, keep both engines and change only the future-race default in lib/game/future-race-engine.ts. Do not downgrade the database or route saved recordings by the new-race default.\nThis source archive is not a deployable hosting archive. Run the release checks and supported publishing workflow before deploying.\n`);
console.log(JSON.stringify({directory:target,sha256,fileCount:names.length,productionDatabaseIncluded:false}));
