import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {decodeOriginalReplayFile} from '../lib/game/replay-file.ts';

const source=ts.createSourceFile('browser-native-menus.ts',readFileSync('lib/game/browser-native-menus.ts','utf8'),ts.ScriptTarget.Latest,true);
let initializer:ts.Expression|undefined;
function visit(node:ts.Node){if(ts.isVariableDeclaration(node)&&node.name.getText(source)==='readSelectedReplay')initializer=node.initializer;ts.forEachChild(node,visit);}
visit(source);assert.ok(initializer);
const code=ts.transpileModule('const select='+initializer.getText(source)+';', {compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const bytes=new Uint8Array(readFileSync('public/game/replays/CTKFIN.RPL'));
for(const mode of ['damaged','metadata-failure','valid']){
 const files={async read(){return mode==='damaged'?new Uint8Array(12):bytes.slice();},physicsEngine(){if(mode==='metadata-failure')throw Error('Invalid retained identity');return 'ms-1991';},framesPerSecond(){return 20;}};
 const harness=new Function('files','decodeOriginalReplayFile',`
 let selectedReplay={name:'OLD',path:'C:\\\\',bytes:new Uint8Array([7]),physicsEngine:'ms-1990',framesPerSecond:20};
 let replay={old:true};const configuration=[7,8],track={raw:[9,10],name:'OLD'};
 ${code}
 return {select,snapshot:()=>structuredClone({selectedReplay,replay,configuration,track})};
 `)(files,decodeOriginalReplayFile);
 const before=harness.snapshot();
 if(mode==='valid'){
  await harness.select({path:'C:\\',name:'NEW'});const after=harness.snapshot();
  assert.equal(after.selectedReplay.physicsEngine,'ms-1991');assert.equal(after.selectedReplay.framesPerSecond,20);
  assert.deepEqual(after.selectedReplay.bytes,bytes);assert.deepEqual(after.configuration,Array.from(bytes.slice(0,24)));
  assert.deepEqual(after.track.raw,Array.from(bytes.slice(24,0x722)));
 }else{
  await assert.rejects(harness.select({path:'C:\\',name:'BAD'}));
  assert.deepEqual(harness.snapshot(),before,'Rejected replay selection must preserve all prior menu state: '+mode);
 }
}
console.log('Actual menu replay selection commits bytes/engine/configuration/track only after decoding and metadata succeed');
