import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {createNativeResourceCatalog} from '../lib/game/native-resource-catalog.ts';
const source=readFileSync(new URL('../lib/server/global-score-data.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
const root=new URL('../public/game/',import.meta.url);
function loader(timers?:{setTimeout:typeof setTimeout;clearTimeout:typeof clearTimeout}){
 return new Function('createNativeResourceCatalog','setTimeout','clearTimeout',stripTypeScriptTypes(source)+';return globalScoreData;')(createNativeResourceCatalog,timers?.setTimeout??setTimeout,timers?.clearTimeout??clearTimeout) as (assets:any,origin:string)=>Promise<any>;
}
test('unfinished resource I/O stays request-owned while completed assets remain cached and copy-safe',async()=>{
 const load=loader();let release!:()=>void,first=true,reads=0;const gate=new Promise<void>(resolve=>{release=resolve;});
 const assets={async fetch(request:Request){const path=new URL(request.url).pathname.slice('/game/'.length);reads++;if(path==='native-resource-base.bin'&&first){first=false;await gate;}return new Response(readFileSync(new URL(path,root)));}};
 const blocked=load(assets,'https://example.test');
 const independent=load(assets,'https://example.test');
 let timer:ReturnType<typeof setTimeout>|undefined;
 assert.equal(await Promise.race([independent.then(()=>true),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),2000);})]),true,'A second request must not await the first request’s unfinished I/O');clearTimeout(timer);
 release();const [a,b]=await Promise.all([blocked,independent]);assert.deepEqual(a.base,b.base);
 assert.notEqual(a.catalog,b.catalog,'Every request owns a separate pending-read catalogue');
 const before=reads,c=await load(assets,'https://example.test');assert.equal(reads,before,'Completed static assets remain cached');
 const manifest=JSON.parse(readFileSync(new URL('original-resources/manifest.json',root),'utf8')),name=Object.keys(manifest.files)[0];
 const bytes=await a.catalog.read(name),original=bytes.slice();bytes.fill(0);assert.deepEqual(await c.catalog.read(name),original,'Callers cannot corrupt cached game-file bytes');
});
test('a stalled asset load times out and does not poison subsequent verification requests',async()=>{
 const timers=new Map<number,()=>void>();let id=0;
 const load=loader({setTimeout:((fn:()=>void)=>{timers.set(++id,fn);return id;}) as unknown as typeof setTimeout,clearTimeout:((key:number)=>timers.delete(key)) as unknown as typeof clearTimeout});
 const stuck=load({fetch:()=>new Promise(()=>{})},'https://example.test');
 const failure=assert.rejects(stuck,/resource load timed out/);for(const fn of [...timers.values()])fn();await failure;
 const data=await load({fetch:async(request:Request)=>new Response(readFileSync(new URL(new URL(request.url).pathname.slice('/game/'.length),root)))},'https://example.test');
 assert.equal(data.base.length,0x100000);assert.equal(data.cars.length,11);assert.equal(timers.size,0);
});
