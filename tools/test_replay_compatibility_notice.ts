import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {faqTranslations} from '../lib/website-faq-translations.ts';
import ts from 'typescript';
import {replayCompatibilityLabel} from '../lib/game/replay-compatibility-label.ts';
const read=(path:string)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const component=read('app/ReplayDownload.tsx');
const tree=ts.createSourceFile('ReplayDownload.tsx',component,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let handler:ts.Expression|undefined;
function find(node:ts.Node){if(ts.isJsxAttribute(node)&&node.name.getText(tree)==='onClick'&&!handler&&node.initializer&&ts.isJsxExpression(node.initializer))handler=node.initializer.expression;ts.forEachChild(node,find);}
find(tree);assert.ok(handler);
const handlerCode=ts.transpileModule('return ('+handler.getText(tree)+');',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
for(const mode of ['network','http','json','shape','missing-engine','invalid-engine']){
 let message='',opened=false;
 const fetch=async()=>{if(mode==='network')throw Error('Offline');return {ok:mode!=='http',async json(){if(mode==='json')throw Error('Bad JSON');return mode==='missing-engine'?{}:mode==='invalid-engine'?{physicsEngine:'latest'}:null;}};};
 const click=new Function('fetch','href','dialog','setMessage','setCompatibility','replayCompatibilityLabel','window',handlerCode)(fetch,'/api/replays?id=test',{current:{open:false,showModal(){opened=true;}}},(value:string)=>{message=value;},()=>{},replayCompatibilityLabel,{});
 await click({preventDefault(){},currentTarget:{getBoundingClientRect(){return {};}}});
 assert.equal(opened,false,'Failed metadata must not offer a misleading download');
 assert.equal(message,'Replay is no longer available','Failed metadata must not silently ignore the click: '+mode);
}
for(const physicsEngine of ['ms-1990','ms-1991','bb-1991']){
 let message='Previous failure',label='',opened=false;
 const panel={open:false,style:{},showModal(){opened=true;},getBoundingClientRect(){return {width:300,height:180};}};
 const click=new Function('fetch','href','dialog','setMessage','setCompatibility','replayCompatibilityLabel','window',handlerCode)(async()=>({ok:true,async json(){return {physicsEngine};}}),'/api/replays?id=test',{current:panel},(value:string)=>{message=value;},(value:string)=>{label=value;},replayCompatibilityLabel,{innerWidth:390,innerHeight:700});
 await click({preventDefault(){},currentTarget:{getBoundingClientRect(){return {left:200,top:300};}}});
 assert.equal(opened,true);assert.equal(message,'');assert.equal(label,replayCompatibilityLabel(physicsEngine));
}
assert.match(component,/useEffect\(\(\)=>\{setMounted\(true\);\},\[\]\)/);
assert.match(component,/mounted&&createPortal/);
assert.match(component,/event.preventDefault\(\)/);
assert.match(component,/panel.showModal\(\)/);
assert.match(component,/13 December 1990/);
assert.match(component,/link.download=''/);
assert.match(component,/text="OK"/);
assert.match(component,/text="Cancel"/);
for(const file of ['app/high-scores/TrackLeaderboard.tsx','app/high-scores/DriverHistory.tsx','app/SharedReplaysPanel.tsx']){
 assert.match(read(file),/<ReplayDownload /);
 assert.doesNotMatch(read(file),/<a[^>]*href=\{'\/api\/replays/);
}
assert.match(read('app/faq/page.tsx'),/Which game versions can play downloaded replays/);
assert.match(read('app/faq/page.tsx'),/Downloading does not convert the recorded physics/);
assert.match(read('app/faq/page.tsx'),/Backups retain stored replay bytes and engine metadata/);
const importNotice='When uploading, choose the game version that recorded the replay. Choosing a version does not convert the recording.';
assert.ok(read('app/faq/page.tsx').includes(importNotice));
assert.equal(faqTranslations[importNotice]?.length,2);
assert.ok(faqTranslations[importNotice].every(text=>text.length>40));
const privateDownloads=read('app/SaveBackupPanel.tsx');
assert.match(privateDownloads,/mounted&&createPortal/);
assert.doesNotMatch(privateDownloads,/typeof document!=='undefined'&&createPortal/);
assert.match(privateDownloads,/replayCompatibilityLabel\(resolvePhysicsEngine\(file.physicsEngine\)\)/);
assert.match(privateDownloads,/requestDownload\(file,event.currentTarget.getBoundingClientRect\(\)\)/);
assert.match(privateDownloads,/if\(pendingDownload\)downloadFile\(pendingDownload\)/);
assert.match(privateDownloads,/replay-compatibility-actions/);
assert.match(privateDownloads,/preparePrivateReplayUpload\(file.name,new Uint8Array\(await file.arrayBuffer\(\)\),localStorage.getItem\(NATIVE_GAME_DIRECTORY_KEY\)\?\?[^;]*,engine\)/);
assert.doesNotMatch(privateDownloads,/browserPreviewGraphicsSettings|experimentalMs91Slow/,'Private imports must not depend on preview opt-in');
assert.match(privateDownloads,/db.importReplay\(replay,existing\)/,'Private import must retain safe track-conflict handling');
const upgradeQuestion='Is the Mindscape 1991 upgrade released?';
const upgradeAnswer='Not yet. Compatibility with Mindscape’s 25 February 1991 edition is being tested locally. The public default has not changed. Stored replays keep their recorded game version and update rate; choosing a different edition for a new race does not convert older recordings.';
for(const text of [upgradeQuestion,upgradeAnswer]){
 assert.ok(read('app/faq/page.tsx').includes(text));
 assert.equal(faqTranslations[text]?.length,2);
 assert.ok(faqTranslations[text].every(value=>value.length>20));
}
console.log('Replay compatibility notice checks passed');
