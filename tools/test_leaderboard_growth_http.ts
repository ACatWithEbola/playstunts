import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {GLOBAL_SCORE_RULES} from '../lib/game/global-score-format.ts';
const origin=process.argv[2]??'http://localhost:3002';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Growth fixtures are local-only');
const sql=(command:string)=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',command],{stdio:'pipe'});
test('directory paginates growing track counts and searches beyond the first page',async()=>{
 const tag=randomUUID().replaceAll('-',''),hashes=Array.from({length:14},(_,i)=>tag+String(i).padStart(32,'0')),ids=hashes.map(hash=>'qa-growth-'+hash);
 const record=Array(52).fill(0);for(const [i,c] of [...'GROWTH QA'].entries())record[i]=c.charCodeAt(0);record[50]=1173&255;record[51]=1173>>>8;
 try{
  // Temporary synthetic directory fixtures, never production race submissions.
  sql(hashes.map((hash,i)=>`INSERT INTO score_tracks(hash,name) VALUES ('${hash}','GROWQA${String(i).padStart(2,'0')}'); INSERT INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at) VALUES ('${ids[i]}','${GLOBAL_SCORE_RULES}','${hash}','PMIN',1173,'${JSON.stringify(record)}',${Math.floor(Date.now()/1000)});`).join('\n'));
  const read=async(query:string)=>{const response=await fetch(origin+'/api/leaderboards?'+query);assert.equal(response.status,200,await response.clone().text());return response.json() as Promise<{boards:{hash:string;name:string}[];hasMore:boolean;totalTracks:number}>};
  const first=await read('q=GROWQA&sort=name'),second=await read('q=GROWQA&sort=name&page=1');
  assert.equal(first.boards.length,12);assert.equal(first.totalTracks,14);assert.equal(first.hasMore,true);assert.equal(second.boards.length,2);assert.equal(second.hasMore,false);assert.equal(new Set([...first.boards,...second.boards].map(board=>board.hash)).size,14);
  const found=await read('q=GROWQA13');assert.equal(found.boards.length,1);assert.equal(found.boards[0].name,'GROWQA13');
  assert.equal((await read('q=%25')).boards.length,0,'Search wildcard input is literal');
  assert.equal((await fetch(origin+'/api/leaderboards?page=-1')).status,400);assert.equal((await fetch(origin+'/api/leaderboards?sort=invalid')).status,400);
 }finally{
  // Remove only this test's exact generated IDs and track hashes.
  sql(`DELETE FROM global_scores WHERE id IN (${ids.map(id=>"'"+id+"'").join(',')}); DELETE FROM score_tracks WHERE hash IN (${hashes.map(hash=>"'"+hash+"'").join(',')});`);
 }
});
