import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {prepareReplayUpload,preparePrivateReplayUpload} from '../lib/game/replay-upload.ts';
import {nativeFileDownload} from '../lib/game/native-file-download.ts';
test('native version-dialog cancellation clears pending upload and permits same-file retry',()=>{
 const source=ts.createSourceFile('SaveBackupPanel.tsx',readFileSync(new URL('../app/SaveBackupPanel.tsx',import.meta.url),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let handler:ts.Expression|undefined;
 const visit=(node:ts.Node)=>{
  if(ts.isJsxOpeningElement(node)&&node.tagName.getText(source)==='dialog'){
   const attrs=node.attributes.properties.filter(ts.isJsxAttribute);
   if(attrs.some(attr=>attr.name.getText(source)==='aria-labelledby'&&attr.initializer&&ts.isStringLiteral(attr.initializer)&&attr.initializer.text==='replay-import-title')){
    const cancel=attrs.find(attr=>attr.name.getText(source)==='onCancel')?.initializer;
    if(cancel&&ts.isJsxExpression(cancel))handler=cancel.expression;
   }
  }
  ts.forEachChild(node,visit);
 };
 visit(source);assert.ok(handler,'Version dialog must handle native Escape cancellation');
 for(const hasInput of [true,false]){
  const pendingReplay={current:{name:'QALAP91.RPL'} as unknown},replayInput={current:hasInput?{value:'C:\\fakepath\\QALAP91.RPL'}:null};
  const cancel=new Function('pendingReplay','replayInput','return ('+handler.getText(source)+');')(pendingReplay,replayInput);
  cancel();assert.equal(pendingReplay.current,null);if(replayInput.current)assert.equal(replayInput.current.value,'');
  cancel();assert.equal(pendingReplay.current,null,'Cancellation is safe when repeated');
 }
});
test('explicit modern import round-trips downloaded controls without changing input files',()=>{
 const bytes=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url))),original=bytes.slice();
 for(const physicsEngine of ['ms-1991','bb-1991'] as const){
  const exported=nativeFileDownload({key:'C:\\TEST.RPL',bytes,physicsEngine}),snapshot=exported.slice();
  const imported=prepareReplayUpload('TEST.RPL',exported,'C:\\',physicsEngine);
  assert.deepEqual(imported.bytes,bytes);assert.equal(imported.physicsEngine,physicsEngine);
  assert.deepEqual(nativeFileDownload(imported),snapshot);assert.deepEqual(exported,snapshot);
  assert.throws(()=>prepareReplayUpload('TEST.RPL',exported,'C:\\'));
 }
 assert.deepEqual(bytes,original);
 const old=prepareReplayUpload('OLD.RPL',bytes,'C:\\');assert.equal(old.physicsEngine,undefined);assert.deepEqual(old.bytes,bytes);
});
test('slow MS91 private imports preserve rate and bytes without changing general/public acceptance',()=>{
 const bytes=new Uint8Array(readFileSync(new URL('../public/game/replays/CTKFIN.RPL',import.meta.url))),before=bytes.slice();
 const output=nativeFileDownload({key:'C:\\SLOW.RPL',bytes,physicsEngine:'ms-1991',framesPerSecond:10}),snapshot=output.slice();
 assert.throws(()=>prepareReplayUpload('SLOW.RPL',output,'C:\\','ms-1991'),/Only 20 Hz/);
 assert.throws(()=>prepareReplayUpload('SLOW.RPL',output,'C:\\'));
 const privateReplay=preparePrivateReplayUpload('SLOW.RPL',output,'C:\\','ms-1991');
 assert.equal(privateReplay.framesPerSecond,10);assert.equal(privateReplay.physicsEngine,'ms-1991');
 assert.deepEqual(privateReplay.bytes,bytes);assert.deepEqual(nativeFileDownload(privateReplay),output);
 assert.throws(()=>preparePrivateReplayUpload('SLOW.RPL',output,'C:\\','bb-1991'));
 assert.throws(()=>preparePrivateReplayUpload('SLOW.RPL',output,'C:\\'));
 assert.deepEqual(output,snapshot);assert.deepEqual(bytes,before);
});
