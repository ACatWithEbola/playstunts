import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {GLOBAL_SCORE_RULES,MAX_RANKED_FRAMES,scoreHash} from '../lib/game/global-score-format.ts';
import {validateTrackEncoding,validateReplayEncoding} from '../lib/game/upload-validation.ts';
import {communityTrackCatalogueSQL,communityReplayTrackDownloadSQL} from '../lib/server/community-replay-tracks.ts';
import {withdrawnCommunityTracks,communityTrackWithdrawn} from '../lib/server/withdrawn-community-tracks.ts';
import {ORIGINAL_STARTER_TRACKS} from '../lib/game/original-starter-tracks.ts';

test('verified public replay tracks are listed and downloadable without rewriting any retained data',async()=>{
 const db=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...v:unknown[]){args=v;return this;},async first(){return db.prepare(sql).get(...args as never[]);},async all(){return {results:db.prepare(sql).all(...args as never[])};}};}};
 const source=readFileSync(new URL('../app/api/tracks/route.ts',import.meta.url),'utf8').split('export async function POST')[0].replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const deps={env:{DB:binding},GLOBAL_SCORE_RULES,MAX_RANKED_FRAMES,communityTrackCatalogueSQL,communityReplayTrackDownloadSQL,scoreHash,validateTrackEncoding,validateReplayEncoding,withdrawnCommunityTracks,communityTrackWithdrawn};
 const GET=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return GET;')(...Object.values(deps));
 const get=(query='')=>GET(new Request('https://example.test/api/tracks'+query)) as Promise<Response>;
 const tracks:Uint8Array[]=[],hashes:string[]=[];
 for(let i=0;i<26;i++){
  const track=Uint8Array.from(ORIGINAL_STARTER_TRACKS[0].raw);track[1801]=i;const hash=await scoreHash(track);tracks.push(track);hashes.push(hash);
  const id=i.toString(16).padStart(64,'0'),replay=new Uint8Array(0x723);replay.set([80,77,73,78]);replay[22]=1;replay.set(track,24);
  const name=i===0?'2FAST4U':i===1?'YNRUPA':i===2?'2FAST4U':'T'+i;
  db.prepare('INSERT INTO score_tracks VALUES (?,?)').run(hash,name);
  const table=i===1?'run_history':'global_scores';
  db.prepare(`INSERT INTO ${table}(id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment) VALUES (?,?,?,?,?,?,?,?,?)`).run(id,i===25?'obsolete':GLOBAL_SCORE_RULES,hash,'PMIN',1,'[]',100,'driver',i===2?'shortcuts_detected':'full_route');
  if(i!==24)db.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run(id,JSON.stringify(Array.from(replay)),name,100);
 }
 // Explicit sharing wins the display name, but never creates duplicate content.
 db.prepare('INSERT INTO shared_tracks VALUES (?,?,?,?)').run(hashes[0],'SHARED',JSON.stringify(Array.from(tracks[0])),101);
 // An orphan recording and a queued proof must not publish private content.
 db.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run('f'.repeat(64),'[1,2,3]','ORPHAN',100);
 db.prepare('INSERT INTO score_submissions(id,submission,track_hash,track_name,car_code,ticks,record,physics_engine,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run('e'.repeat(64),'{}','d'.repeat(64),'PENDING','PMIN',1,'[]','ms-1991',100,100);
 const tables=['shared_tracks','shared_replays','global_scores','run_history','accepted_scores','score_submissions'];
 const snapshot=()=>tables.map(table=>db.prepare('SELECT * FROM '+table+' ORDER BY rowid').all());const before=snapshot();
 let query='',rows:{hash:string;name:string}[]=[],pages=0;
 do{const response=await get(query);assert.equal(response.status,200);const body=await response.json() as {tracks:{hash:string;name:string}[];next:string|null};rows.push(...body.tracks);query=body.next?'?before='+encodeURIComponent(body.next):'';pages++;assert.ok(pages<=3);}while(query);
 assert.equal(pages,2);assert.equal(rows.length,24);assert.equal(new Set(rows.map(t=>t.hash)).size,24);
 assert.equal(rows.find(t=>t.hash===hashes[0])!.name,'SHARED');assert.equal(rows.find(t=>t.hash===hashes[1])!.name,'YNRUPA');
 assert.ok(rows.some(t=>t.hash===hashes[2]),'A verified exploit replay also publishes its exact track');
 for(const index of [0,1,2,23]){const response=await get('?id='+hashes[index]);assert.equal(response.status,200);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),tracks[index]);assert.match(response.headers.get('Cache-Control')!,/immutable/);}
 for(const hash of [hashes[24],hashes[25],'d'.repeat(64),withdrawnCommunityTracks[0]])assert.equal((await get('?id='+hash)).status,404);
 assert.deepEqual(snapshot(),before,'All listing/download requests are read-only');
 // Refuse corrupted replay bytes or a hash mismatch, never cache an error.
 const id='1'.padStart(64,'0'),original=db.prepare('SELECT replay FROM shared_replays WHERE id=?').get(id)!.replay;
 for(const replay of ['[1,2,3]',JSON.stringify(Array(0x723).fill(256)),JSON.stringify([...JSON.parse(String(original))].map((v,i)=>i===24?(v+1)%256:v))]){
  db.prepare('UPDATE shared_replays SET replay=? WHERE id=?').run(replay,id);const response=await get('?id='+hashes[1]);assert.equal(response.status,503);assert.equal(response.headers.get('Cache-Control'),'no-store');
 }
 db.close();
});
