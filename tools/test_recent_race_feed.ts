import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import * as jsx from 'react/jsx-runtime';
import {recentRaceFeed} from '../lib/game/recent-race-feed.ts';

test('pending and verified entries share a newest-first seven-run limit without mutating either source',()=>{
 const verified=Array.from({length:7},(_,i)=>({id:'v'+i,postedAt:100-i*2}));
 const pending=Array.from({length:7},(_,i)=>({id:'p'+i,postedAt:101-i*2,verifiedId:null}));
 const before=JSON.stringify({verified,pending}),rows=recentRaceFeed(verified,pending);
 assert.equal(rows.length,7);assert.deepEqual(rows.map(r=>r.run.id),['p0','v0','p1','v1','p2','v2','p3']);
 assert.equal(JSON.stringify({verified,pending}),before);
 for(const count of [0,1,7,50])assert.equal(recentRaceFeed([],pending.slice(0,count)).length,Math.min(count,7));
});
test('verified receipts replace overlapping pending entries; duplicates never consume places',()=>{
 const verified=[{id:'accepted',postedAt:10},{id:'accepted',postedAt:10},{id:'older',postedAt:8}];
 const pending=[{id:'queued',postedAt:9,verifiedId:'accepted'},{id:'waiting',postedAt:11,verifiedId:null}];
 const rows=recentRaceFeed(verified,pending);
 assert.deepEqual(rows.map(r=>[r.kind,r.run.id]),[['pending','waiting'],['verified','accepted'],['verified','older']]);
 assert.deepEqual(recentRaceFeed([],[]),[]);
});
test('actual Recent Races component renders at most seven and refreshes after verification and on its timer',async()=>{
 const race=(id:string,postedAt:number)=>({id,postedAt,driver:id,track:'DEFAULT',car:'Car',ticks:100,event:'valid',valid:true,improvement:null});
 let serverRaces=Array.from({length:7},(_,i)=>race('v'+i,100-i*2));
 let submissions=Array.from({length:7},(_,i)=>({...race('p'+i,101-i*2),state:'queued',verifiedId:null as string|null}));
 const states:any[]=[];let cursor=0,effect:(()=>void|(()=>void))|undefined,requests=0;
 const listeners=new Map<string,()=>void>(),intervals=new Map<number,()=>void>();
 const require=(id:string):any=>{
  if(id==='react')return {useState:(initial:unknown)=>{const index=cursor++;if(!(index in states))states[index]=initial;return[states[index],(value:unknown)=>{states[index]=value;}];},useEffect:(fn:()=>void)=>{effect=fn;}};
  if(id==='react/jsx-runtime')return jsx;
  if(id.includes('recent-race-feed'))return {recentRaceFeed};
  if(id.includes('usePublicSubmissions'))return {usePublicSubmissions:()=>({submissions})};
  if(id.includes('WebsiteLanguage'))return {WebsiteText:()=>null,useWebsiteLocale:()=> 'en'};
  return new Proxy({},{get:()=>()=>null});
 };
 const exports:any={},code=ts.transpileModule(readFileSync(new URL('../app/RecentRacesPanel.tsx',import.meta.url),'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('require','exports','fetch','document','window','setInterval','clearInterval',code)(require,exports,async()=>{requests++;return Response.json({races:serverRaces});},{hidden:false,addEventListener:(name:string,fn:()=>void)=>listeners.set(name,fn),removeEventListener:(name:string)=>listeners.delete(name)},{addEventListener:(name:string,fn:()=>void)=>listeners.set(name,fn),removeEventListener:(name:string)=>listeners.delete(name)},(fn:()=>void)=>{intervals.set(1,fn);return 1;},(id:number)=>intervals.delete(id));
 const render=()=>{cursor=0;return exports.default();};
 const find=(node:any,type:string):any[]=>!node||typeof node!=='object'?[]:[...(node.type===type?[node]:[]),...[node.props?.children].flat(Infinity).flatMap(child=>find(child,type))];
 let tree=render();assert.equal(find(tree,'li').length,7);assert.equal(find(tree,'ol').length,1);
 const cleanup=effect!();await new Promise(resolve=>setImmediate(resolve));
 tree=render();assert.equal(find(tree,'li').length,7);assert.equal(find(tree,'ol').length,1);
 assert.equal(find(tree,'span').filter(n=>n.props.className==='verification-badge').length,4);
 // A real completion signal reloads verified activity; no browser reload is needed.
 submissions=submissions.filter(run=>run.id!=='p0');serverRaces=[race('p0',101),...serverRaces].slice(0,7);
 listeners.get('stunts-score-verification-changed')!();await new Promise(resolve=>setImmediate(resolve));
 tree=render();assert.equal(requests,2);assert.equal(find(tree,'li').length,7);
 assert.equal(find(tree,'span').filter(n=>n.props.className==='verification-badge').length,3);
 intervals.get(1)!();await new Promise(resolve=>setImmediate(resolve));assert.equal(requests,3);
 serverRaces[0].event='improved';listeners.get('stunts-score-verification-changed')!();await new Promise(resolve=>setImmediate(resolve));
 let labels=find(render(),'span').flatMap(node=>[node.props.children].flat(Infinity)).map(node=>node?.props?.text);
 assert.ok(labels.includes('set a new personal best'));assert.ok(!labels.includes('set a new high score'));
 serverRaces[0].event='record';listeners.get('stunts-score-verification-changed')!();await new Promise(resolve=>setImmediate(resolve));
 labels=find(render(),'span').flatMap(node=>[node.props.children].flat(Infinity)).map(node=>node?.props?.text);assert.ok(labels.includes('set a new high score'));
 cleanup?.();assert.equal(listeners.size,0);assert.equal(intervals.size,0);
});
