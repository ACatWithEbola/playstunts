import {boundedRequestText} from '../lib/server/bounded-request-body.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {withdrawnCommunityTracks,communityTrackWithdrawn} from '../lib/server/withdrawn-community-tracks.ts';
import {scoreHash} from '../lib/game/global-score-format.ts';
import {validateTrackEncoding} from '../lib/game/upload-validation.ts';
import {ORIGINAL_STARTER_TRACKS} from '../lib/game/original-starter-tracks.ts';
test('withdrawal hides only the exact shared track, blocks download and resharing, and preserves stored bytes',async()=>{
 const db=new DatabaseSync(':memory:');db.exec('CREATE TABLE shared_tracks(hash TEXT,name TEXT,bytes TEXT,created_at INTEGER); CREATE TABLE score_requests(bucket TEXT PRIMARY KEY,count INTEGER,expires_at INTEGER)');
 const track=new Uint8Array(1802),hash=withdrawnCommunityTracks[0],other=await scoreHash(track);for(const id of [hash,other])db.prepare('INSERT INTO shared_tracks VALUES (?,?,?,?)').run(id,id===hash?'TEST':'OTHER',JSON.stringify(Array.from(track)),1);
 const retained=db.prepare('SELECT * FROM shared_tracks ORDER BY hash').all();
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...v:unknown[]){args=v;return this;},async first(){return db.prepare(sql).get(...args as never[]);},async all(){return {results:db.prepare(sql).all(...args as never[])};}};},async batch(){throw Error('Withdrawal must not write track data');}};
 const source=readFileSync(new URL('../app/api/tracks/route.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const deps={boundedRequestText,env:{DB:binding,ASSETS:{}},withdrawnCommunityTracks,communityTrackWithdrawn,scoreHash,validateTrackEncoding,validateSharedTrack:async()=>({hash,name:'TEST',bytes:new Uint8Array(1802)}),globalScoreData:async()=>({})};
 const {GET,POST}=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return {GET,POST};')(...Object.values(deps));
 assert.equal((await GET(new Request('https://example.test/api/tracks?id='+hash))).status,404);
 const list=await(await GET(new Request('https://example.test/api/tracks'))).json();assert.deepEqual(list.tracks.map((t:{hash:string})=>t.hash),[other]);
 assert.equal((await GET(new Request('https://example.test/api/tracks?id='+other))).status,200);
 const post=await POST(new Request('https://example.test/api/tracks',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Track':'share'},body:'{}'}));assert.equal(post.status,409);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM shared_tracks').get()!.n,2);assert.deepEqual(db.prepare('SELECT * FROM shared_tracks ORDER BY hash').all(),retained);db.close();
});
test('track downloads reject malformed or mismatched retained content without immutable caching',async()=>{
 const track=Uint8Array.from(ORIGINAL_STARTER_TRACKS.find(track=>track.name==='DEFAULT')!.raw),before=track.slice(),hash=await scoreHash(track);let value:unknown=Array.from(track),name='CUSTOM';
 const db={prepare(sql:string){assert.match(sql,/^SELECT /);return {bind(){return this;},async first(){return {name,bytes:JSON.stringify(value)};}};}};
 const source=readFileSync(new URL('../app/api/tracks/route.ts',import.meta.url),'utf8').split('export async function POST')[0].replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const deps={env:{DB:db},scoreHash,validateTrackEncoding,withdrawnCommunityTracks,communityTrackWithdrawn};
 const GET=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return GET;')(...Object.values(deps));
 const request=()=>GET(new Request('https://example.test/api/tracks?id='+hash));
 const valid=await request();assert.equal(valid.status,200);assert.match(valid.headers.get('Cache-Control'),/immutable/);assert.deepEqual(new Uint8Array(await valid.arrayBuffer()),track);
 const malformed:unknown[]=[null,{},[],Array(1801).fill(0)];
 for(const bad of [256,-1,1.5,'0',null]){const changed:unknown[]=Array.from(track);changed[0]=bad;malformed.push(changed);}
 const different=Array.from(track);different[0]=1;malformed.push(different);
 for(const bad of malformed){value=bad;const response=await request();assert.equal(response.status,503);assert.equal(response.headers.get('Content-Disposition'),null);assert.equal(response.headers.get('Cache-Control'),'no-store');}
 value=Array.from(track);name='INVALID NAME';assert.equal((await request()).status,503);
 assert.deepEqual(track,before);
});
