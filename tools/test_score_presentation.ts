import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as jsx from 'react/jsx-runtime';

function load(file:string,states:unknown[]){
 let index=0;
 const exports:Record<string,any>={};
 const require=(id:string)=>{
  if(id==='react')return {useState:()=>[states[index++],()=>{}],useEffect:()=>{},useRef:()=>({current:null})};
  if(id==='react/jsx-runtime')return jsx;
  if(id==='react-dom')return {createPortal:(child:unknown)=>child};
  if(id.includes('WebsiteLanguage'))return {WebsiteText:({text}:{text:string})=>text,WebsiteElement:({as='div',children,...props}:any)=>React.createElement(as,props,children),useWebsiteLocale:()=> 'en'};
  if(id.includes('route-display'))return {routeDisplay:()=>({detail:'Details'})};
  return new Proxy({},{get:()=>({children}:any)=>children??null});
 };
 const source=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 new Function('require','exports',code)(require,exports);
 return exports.default;
}
test('Valid is default; category and car views cannot change the valid track record',()=>{
 const valid={id:'v',driver:'Valid driver',car:'Valid car',carCode:'V',ticks:1600,routeAssessment:'full_route',postedAt:1};
 const exploit={...valid,id:'e',driver:'Exploit driver',ticks:500,routeAssessment:'shortcuts_detected'};
 const board={hash:'h',name:'DEFAULT',cars:[{code:'V',name:'Valid car'}],categories:{full_route:{scores:[valid],cars:[{code:'V',scores:[valid]}]},shortcuts_detected:{scores:[exploit],cars:[{code:'V',scores:[exploit]}]}}};
 for(const mode of ['overall','car'])for(const category of ['full_route','shortcuts_detected']){
  const Component=load('app/high-scores/TrackLeaderboard.tsx',[mode,'V',category]);
  const html=renderToStaticMarkup(React.createElement(Component,{board}));
  const header=html.slice(0,html.indexOf('</header>'));
  assert.match(header,/Valid driver/);assert.match(header,/1:20.00/);assert.doesNotMatch(header,/Exploit driver/);
  assert.doesNotMatch(html,/All runs|Unverified/);
 }
 const source=readFileSync(new URL('../app/high-scores/TrackLeaderboard.tsx',import.meta.url),'utf8');
 assert.match(source,/useState<'full_route'\|'shortcuts_detected'>\('full_route'\)/);
});
test('Overlay is a fullscreen-contained dialog; publication requires explicit consent',()=>{
 for(const consent of [false,true]){
  const Component=load('app/GlobalScoreStatus.tsx',['',{track:'DEFAULT',ticks:1998,submit:async()=> 'accepted'},'Sven',false,consent,{}]);
  const html=renderToStaticMarkup(React.createElement(Component));
  assert.match(html,/role="dialog"/);assert.match(html,/aria-modal="true"/);assert.match(html,/1:39.90/);
  const submit=html.match(/<button type="submit"[^>]*>/)![0];
  assert.equal(submit.includes('disabled'),!consent);
 }
 const source=readFileSync(new URL('../app/GlobalScoreStatus.tsx',import.meta.url),'utf8');
 assert.match(source,/createPortal\(panel,target\)/);assert.match(source,/querySelector\('\.launcher-screen'\)/);
 assert.match(source,/useState\(false\),\[target/);assert.match(source,/game.inert=true/);assert.match(source,/game.inert=false/);
});
