import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
let input='';for await(const chunk of process.stdin)input+=chunk;
const {secret,phase,directory}=JSON.parse(input);
if(!/^[a-f0-9]{96}$/.test(secret)||!['backup','purge','verify'].includes(phase)||!directory.startsWith('/Users/svenanders/Documents/Codex/'))throw Error('Invalid operation');
const digest=text=>createHash('sha256').update(text).digest('hex');
const request=async(body)=>{const response=await fetch('https://playstunts.com/api/leaderboard-maintenance',{method:body?'POST':'GET',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});const json=await response.json();if(!response.ok)throw Error(JSON.stringify(json));return json;};
const path=directory+'/live-database-before-reset.json';
if(phase==='backup'){
 await request({action:'backup'});const archive=await request();if(digest(archive.payload)!==archive.sha256)throw Error('Backup checksum mismatch');
 const tables=JSON.parse(archive.payload).tables;if(Object.keys(tables).length!==8)throw Error('Incomplete backup');
 await mkdir(directory,{recursive:true,mode:0o700});await writeFile(path,JSON.stringify(archive,null,2),{mode:0o600,flag:'wx'});
 const reread=JSON.parse(await readFile(path,'utf8'));if(digest(reread.payload)!==archive.sha256)throw Error('Saved backup checksum mismatch');
 console.log(JSON.stringify({backup:path,sha256:archive.sha256,counts:Object.fromEntries(Object.entries(tables).map(([table,rows])=>[table,rows.length]))}));
}else{
 const archive=JSON.parse(await readFile(path,'utf8'));if(digest(archive.payload)!==archive.sha256)throw Error('Local backup checksum mismatch');
 if(phase==='purge')console.log(JSON.stringify(await request({action:'purge',sha256:archive.sha256})));
 const current=await request();const before=JSON.parse(archive.payload).tables,after=current.current.tables;
 for(const table of ['shared_replays','run_history','accepted_scores','global_scores','score_requests','replay_assessment_lock'])if(after[table].length)throw Error('Nonempty purged table: '+table);
 for(const table of ['shared_tracks','score_tracks'])if(JSON.stringify(before[table])!==JSON.stringify(after[table]))throw Error('Track preservation failed');
 if(current.payload!==archive.payload||!current.purged_at)throw Error('Archive preservation failed');
 await writeFile(directory+'/reset-verification.json',JSON.stringify({verifiedAt:new Date().toISOString(),backupSha256:archive.sha256,purgedAt:current.purged_at,counts:Object.fromEntries(Object.entries(after).map(([table,rows])=>[table,rows.length]))},null,2),{mode:0o600});
 console.log('Purge verified; all tracks and complete private backup retained.');
}
