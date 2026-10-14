/** Generated original-game data stays local, even if force-staged accidentally. */
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export function originalResourceBoundaryFindings(tracked,recipes){
 const protectedPaths=new Set(recipes.outputs.map(row=>'lib/game/'+row.path));
 return tracked.filter(path=>protectedPaths.has(path));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const recipes=JSON.parse(readFileSync(new URL('../docs/ms91-resource-recipes.json',import.meta.url)));
 const index=spawnSync('git',['ls-files','--cached','-z'],{encoding:'utf8'});
 if(index.status!==0){
  // A downloaded source ZIP has no index. Only an explicit local build may
  // proceed without a publication audit; direct publication checks stay strict.
  const repository=spawnSync('git',['rev-parse','--is-inside-work-tree'],{encoding:'utf8'});
  if(process.argv.includes('--local-build')&&repository.status!==0){
   console.log('Local source-archive build: no Git index; publication boundary is not verified');
   process.exit(0);
  }
  throw Error('Source publication requires a readable Git index');
 }
 const tracked=index.stdout.split('\0').filter(Boolean);
 const findings=originalResourceBoundaryFindings(tracked,recipes);
 if(findings.length){console.error('Source publication blocked: generated original-game resources are tracked/staged:\n'+findings.join('\n'));process.exitCode=1;}
 else console.log('Seven generated MS1991 resource modules remain outside the Git source publication set');
}
