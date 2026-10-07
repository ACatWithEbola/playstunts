import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
import {publicLeaderboards} from '../lib/server/public-leaderboards.ts';
import {combinedCarScoresSQL} from '../lib/server/leaderboard-ranking.ts';
import {withdrawnCommunityTracks} from '../lib/server/withdrawn-community-tracks.ts';
test('withdrawn track is absent from search, pages and totals without deleting any scores',async()=>{
 const db=new DatabaseSync(':memory:');for(const f of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
 const hidden=withdrawnCommunityTracks[0],other='f'.repeat(64),record=Array(52).fill(0);record[0]=65;record[50]=100;
 for(const hash of [hidden,other]){db.prepare('INSERT INTO score_tracks(hash,name) VALUES (?,?)').run(hash,hash===hidden?'TEST':'CHERRIS');db.prepare('INSERT INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment) VALUES (?,?,?,?,?,?,?,?,?)').run(hash,GLOBAL_SCORE_RULES,hash,'PMIN',100,JSON.stringify(record),1,'name:a','full_route');}
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...v:unknown[]){args=v;return this;},async first(){return db.prepare(sql).get(...args as never[]);},async all(){return {results:db.prepare(sql).all(...args as never[])};}};}};
 const source=readFileSync(new URL('../app/api/leaderboards/route.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const deps={env:{DB:binding,ASSETS:{}},GLOBAL_SCORE_RULES,createTrackLabelCatalog:()=>async()=>new Map(),ORIGINAL_STARTER_TRACKS:[],publicLeaderboards,combinedCarScoresSQL,withdrawnCommunityTracks};
 const GET=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return GET;')(...Object.values(deps));
 const all=await(await GET(new Request('https://example.test/api/leaderboards'))).json();assert.deepEqual(all.boards.map((b:{hash:string})=>b.hash),[other]);assert.equal(all.totalTracks,1);assert.equal(all.summary.tracks,1);assert.equal(all.summary.scores,1);
 const search=await(await GET(new Request('https://example.test/api/leaderboards?q=TEST'))).json();assert.equal(search.totalTracks,0);assert.equal(search.boards.length,0);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM global_scores').get()!.n,2);db.close();
});
