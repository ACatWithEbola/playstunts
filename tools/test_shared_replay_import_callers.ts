import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';

// Exercise the actual event handlers, not just the presence of a function name.
for(const file of ['app/high-scores/ScoreReplayDownload.tsx','app/SharedReplaysPanel.tsx','app/SharedTracksPanel.tsx']){
 for(const conflict of [false,true])test(`${file}: ${conflict?'stale plan cannot announce success':'snapshot accompanies successful import'}`,async()=>{
  const snapshot=[{key:'c:\\kept.rpl',bytes:new Uint8Array([1]),physicsEngine:'ms-1991'}];
  const track=file.includes('SharedTracks'),score=file.includes('ScoreReplayDownload');
  const planned=[{key:track?'C:\\NEW.TRK':'C:\\NEW.RPL',bytes:new Uint8Array([2])}];
  const messages:unknown[]=[];let closed=0,merged=0,plannedCount=0;
  let finish!:()=>void;const done=new Promise<void>(resolve=>{finish=resolve;});
  let index=0;
  const states=track?[[{hash:'a'.repeat(64),name:'CUSTOM'}],null,'',false,true,10]:score?[false,'']:[[{id:'proof',driver:'Sven',trackName:'DEFAULT',car:'Car',ticks:20}],'',false,true,'','','fastest',0,false,[],[],10];
  const persistence={all:async()=>snapshot,close:()=>{closed++;},merge:async(files:unknown,expected:unknown)=>{
   merged++;assert.equal(files,planned);assert.equal(expected,snapshot,'Import must commit against the exact planning snapshot');
   if(conflict)throw Error('Concurrent save conflict');return 1;
  }};
  const require=(id:string):any=>{
   if(id==='react')return {useState:()=>{const position=index++;return [states[position],(value:unknown)=>{if(position===(track?2:1))messages.push(value);if(position===(track?3:score?0:2)&&value===false)finish();}];},useEffect:()=>{},useRef:()=>({current:0}),useCallback:(fn:unknown)=>fn};
   if(id==='react/jsx-runtime')return jsx;
   if(id.includes('shared-replay-import'))return {prepareSharedReplayImport:(_bytes:unknown,_id:unknown,_directory:unknown,existing:unknown,engine:unknown)=>{plannedCount++;assert.equal(existing,snapshot);assert.equal(engine,'ms-1991');return {replayName:'NEW',files:planned};}};
   if(id.includes('shared-track-import'))return {prepareSharedTrackImport:(_name:unknown,_hash:unknown,_bytes:unknown,_directory:unknown,existing:unknown)=>{plannedCount++;assert.equal(existing,snapshot);return {selected:'NEW',files:planned};}};
   if(id.includes('native-file-store'))return {openNativeFilePersistence:async()=>persistence};
   if(id.includes('upload-validation'))return {validateReplayEncoding:()=>{}};
   if(id.includes('engine-version'))return {resolvePhysicsEngine:(value:unknown)=>value};
   if(id.includes('browser-setup-selection'))return {NATIVE_GAME_DIRECTORY_KEY:'directory'};
   if(id.includes('global-score-format'))return {MAX_RANKED_FRAMES:100};
   return new Proxy({},{get:()=>()=>null});
  };
  const exports:any={};
  const code=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
  new Function('require','exports','fetch','localStorage',code)(require,exports,async()=>new Response(new Uint8Array([1]),{headers:{'X-Stunts-Physics-Engine':'ms-1991'}}),{getItem:()=>null});
  const tree=exports.default({id:'proof',className:'scores-replay-dot',running:false});
  const find=(node:any):any=>{if(!node||typeof node!=='object')return;const props=node.props;if(node.type==='button'&&(props.className==='scores-replay-add'||props.children?.props?.text===(track?'Add to my game':'Add replay to my game')))return node;for(const child of [props?.children].flat(Infinity)){const found=find(child);if(found)return found;}};
  const button=find(tree);assert.ok(button);button.props.onClick();await done;
  assert.equal(plannedCount,1);assert.equal(merged,1);assert.equal(closed,1);
  if(conflict){assert.ok(messages.includes('Concurrent save conflict'));assert.ok(!messages.some(value=>String(value).includes(' added.')));}
  else assert.ok(messages.some(value=>String(value).includes('NEW added.')));
 });
}
