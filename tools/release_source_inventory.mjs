/** Read-only candidate source/dependency inventory; never stages or publishes. */
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,lstatSync,readlinkSync,writeFileSync} from 'node:fs';
import {resolve,dirname,isAbsolute,relative} from 'node:path';
import {createHash} from 'node:crypto';
import ts from 'typescript';

const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
const paths=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root}).toString().split('\0').filter(Boolean);
const selected=new Set(paths.filter(path=>existsSync(resolve(root,path))));
const generated=new Set(JSON.parse(readFileSync(resolve(root,'docs/ms91-resource-recipes.json'))).outputs.map(row=>'lib/game/'+row.path));
const findings=[],imports=[],external=new Map();
const extensions=['','.ts','.tsx','.js','.mjs','.json','/index.ts','/index.tsx'];
function dependency(owner,specifier,kind){
 if(!specifier.startsWith('.')&&!specifier.startsWith('@/'))return;
 const local=specifier.split(/[?#]/,1)[0];
 const target=local.startsWith('@/')?resolve(root,local.slice(2)):resolve(root,dirname(owner),local);
 const found=extensions.map(suffix=>target+suffix).find(path=>existsSync(path)&&!lstatSync(path).isDirectory());
 if(!found){findings.push({owner,specifier,kind,reason:'missing on disk'});return;}
 const path=relative(root,found);
 if(owner==='next-env.d.ts'&&path==='.next/types/routes.d.ts'){external.set(path,'Generated framework route types: npm run dev/build');return;}
 if(path.startsWith('public/')){external.set('public','Prepared game/site assets: README installation and assets preparation');return;}
 if(generated.has(path)){external.set(path,'docs/ms91-resource-recipes.json and tools/prepare_ms91_resources.py');return;}
 imports.push({owner,path,kind});
 if(!selected.has(path))findings.push({owner,specifier,path,kind,reason:'dependency absent from candidate Git source set'});
}
for(const path of selected){
 if(!/\.[cm]?[jt]sx?$/.test(path)||lstatSync(resolve(root,path)).isSymbolicLink())continue;
 const source=ts.createSourceFile(path,readFileSync(resolve(root,path),'utf8'),ts.ScriptTarget.Latest,true);
 const visit=node=>{
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))dependency(path,node.moduleSpecifier.text,'module');
  if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||ts.isIdentifier(node.expression)&&node.expression.text==='require')&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0]))dependency(path,node.arguments[0].text,'dynamic module');
  ts.forEachChild(node,visit);
 };visit(source);
}
const pkg=JSON.parse(readFileSync(resolve(root,'package.json')));
for(const [name,command] of Object.entries(pkg.scripts)){
 for(const match of command.matchAll(/(?:^|\s)((?:tools|scripts)\/[A-Za-z0-9_./-]+\.(?:[cm]?[jt]s|py))(?=\s|$)/g)){
  if(!selected.has(match[1]))findings.push({owner:'package.json',script:name,path:match[1],reason:'script target absent from candidate Git source set'});
 }
}
for(const entry of JSON.parse(readFileSync(resolve(root,'drizzle/meta/_journal.json'))).entries){
 const path='drizzle/'+entry.tag+'.sql';if(!selected.has(path))findings.push({owner:'drizzle/meta/_journal.json',path,reason:'migration absent from candidate Git source set'});
}
const entries=[...selected].sort().map(path=>{
 const file=resolve(root,path),stat=lstatSync(file);
 if(stat.isSymbolicLink())return {path,type:'symlink',target:readlinkSync(file)};
 if(!stat.isFile())throw Error('Unsupported candidate path: '+path);
 const bytes=readFileSync(file);return {path,type:'file',bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
});
const report={kind:'candidate-source-inventory-not-review-approval',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),entries,dependencies:imports,externalInputs:[...external].map(([path,recipe])=>({path,recipe})),findings,limitations:['Literal module imports and package script targets only; computed paths and runtime fixtures require separate review.','Does not establish licensing, secret safety, behavior review, tests or deployable asset completeness.'],staged:false,published:false};
const outputIndex=process.argv.indexOf('--output');
if(outputIndex!==-1){
 const output=process.argv[outputIndex+1];
 if(!output||!isAbsolute(output)||resolve(output).startsWith(root+'/'))throw Error('Inventory artifact must be an absolute new file outside the checkout');
 writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
}
console.log(JSON.stringify(process.argv.includes('--summary')?{...report,entries:entries.length,dependencies:imports.length}:report,null,2));
if(findings.length)process.exitCode=1;
