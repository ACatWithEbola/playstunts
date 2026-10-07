import {boundedRequestText} from '../lib/server/bounded-request-body.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {GLOBAL_SCORE_RULES,scoreString} from '../lib/game/global-score-format.ts';
import {publicScoreName} from '../lib/game/public-score-name.ts';
import {replayScoresSQL} from '../lib/server/shared-replay-retention.ts';
import {publicLeaderboards,type PublicScoreRow} from '../lib/server/public-leaderboards.ts';
test('replay filters apply before pagination, with deterministic fastest and newest sorting',async()=>{
 const db=new DatabaseSync(':memory:');for(const f of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
 const record=Array(52).fill(0);record[0]=65;record[17]=67;
 for(let i=0;i<65;i++){const id=i.toString(16).padStart(64,'0'),track=(i===64?'b':'a').repeat(64),car=i===64?'FGTO':'PMIN';db.prepare('INSERT INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment) VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,track,car,100+i,JSON.stringify(record),i,'name:'+i,'full_route');db.prepare('INSERT INTO shared_replays(id,track_name,replay,created_at) VALUES (?,?,?,?)').run(id,i===64?'CUSTOM':'DEFAULT','[]',i);}
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...v:unknown[]){args=v;return this;},async first(){return db.prepare(sql).get(...args as never[]);},async all(){return {results:db.prepare(sql).all(...args as never[])};}};}};
 const source=readFileSync(new URL('../app/api/replays/route.ts',import.meta.url),'utf8').split('export async function POST')[0].replace(/^import .*;\n/gm,'').replace('export async function','async function');
 const deps={boundedRequestText,env:{DB:binding},GLOBAL_SCORE_RULES,scoreString,publicScoreName,replayScoresSQL};const GET=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return GET;')(...Object.values(deps));
 const get=async(q:string)=>(await GET(new Request('https://example.test/api/replays'+q))).json();
 const first=await get('');assert.equal(first.replays.length,50);assert.equal(first.hasMore,true);assert.equal(first.replays[0].ticks,100);assert.equal(first.tracks.length,2);
 const second=await get('?page=1');assert.equal(second.replays.length,15);assert.equal(second.hasMore,false);assert.equal(second.replays[0].ticks,150);
 const filtered=await get('?car=FGTO');assert.equal(filtered.replays.length,1);assert.equal(filtered.replays[0].ticks,164);
 const track=await get('?track='+('b'.repeat(64)));assert.equal(track.replays.length,1);
 const newest=await get('?sort=newest');assert.equal(newest.replays[0].ticks,164);
 for(const q of ['?page=-1','?page=1.5','?sort=oops','?car=bad%27'])assert.equal((await GET(new Request('https://example.test/api/replays'+q))).status,400);
 assert.equal(db.prepare('SELECT COUNT(*) n FROM shared_replays').get()!.n,65);db.close();
});
test('all and category boards each show ten drivers, retaining slower valid runs independently',()=>{
 const rows:PublicScoreRow[]=Array.from({length:12},(_,i)=>{const record=Array(52).fill(0);Array.from('Driver'+i,c=>c.charCodeAt(0)).forEach((c,j)=>record[j]=c);return {id:String(i),track_hash:'track',car_code:'PMIN',ticks:100+i,record:JSON.stringify(record),created_at:i,track_name:'DEFAULT',has_replay:1,route_assessment:'full_route'};});
 rows.push({...rows[0],id:'shortcut',ticks:90,route_assessment:'shortcuts_detected'});
 const [board]=publicLeaderboards(rows,new Map());assert.equal(board.scores.length,10);assert.equal(board.cars[0].scores.length,10);assert.equal(board.categories!.full_route.scores.length,10);assert.equal(board.scores[0].id,'shortcut');assert.equal(board.categories!.full_route.scores[0].id,'0');assert.equal(board.categories!.shortcuts_detected.scores.length,1);
});
