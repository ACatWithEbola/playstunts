import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const origin=process.argv[2]??'http://localhost:3002';
test('explicit sharing deduplicates tracks and another client receives original bytes',async()=>{
 const bytes=Array.from(readFileSync(new URL('../public/game/original-resources/DEFAULT.TRK',import.meta.url)));
 const submit=(value:unknown)=>fetch(origin+'/api/tracks',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Track':'share'},body:JSON.stringify(value)});
 const first=await submit({name:'QA_TEST',bytes}),body=await first.json() as {id:string;error?:string};assert.equal(first.status,200,JSON.stringify(body));
 const renamed=await submit({name:'RENAMED',bytes}),second=await renamed.json() as {id:string};assert.equal(second.id,body.id);
 const list=await fetch(origin+'/api/tracks').then(r=>r.json()) as {tracks:{hash:string}[]};assert.equal(list.tracks.filter(t=>t.hash===body.id).length,1);
 const downloaded=await fetch(origin+'/api/tracks?id='+body.id);assert.equal(downloaded.status,200);assert.deepEqual(Array.from(new Uint8Array(await downloaded.arrayBuffer())),bytes);
 assert.equal((await submit({name:'BROKEN',bytes:Array(1802).fill(0)})).status,422);
 assert.equal((await submit({name:'BAD',bytes:[1,2,3]})).status,422);
 assert.equal((await fetch(origin+'/api/tracks?before=bad')).status,400);
});
