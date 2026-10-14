import {test} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync,readdirSync} from 'node:fs';import {stripTypeScriptTypes} from 'node:module';
import {readRaceEngine} from '../lib/server/race-engine-metadata.ts';
import {engineScopedRanking,engineScorePredicate} from '../lib/server/engine-scoped-ranking.ts';
import {retainRunHistorySQL,pruneRunHistorySQL} from '../lib/server/run-history.ts';import {driverKey,resolvedDriverSQL,combinedCarScoresSQL,pruneCarScoresSQL} from '../lib/server/leaderboard-ranking.ts';import {GLOBAL_SCORE_RULES,scoreString} from '../lib/game/global-score-format.ts';import {publicScoreName} from '../lib/game/public-score-name.ts';
const record=(name:string,car:string)=>{const r=Array(52).fill(0);[...name].forEach((c,i)=>r[i]=c.charCodeAt(0));[...car].forEach((c,i)=>r[17+i]=c.charCodeAt(0));return r;};
test('history keeps the latest five verified attempts across cars, including slower non-ranking runs',()=>{
 const db=new DatabaseSync(':memory:');for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>/^\d+.*\.sql$/.test(f)).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 for(let i=0;i<8;i++){const car=i%2?'FGTO':'PMIN',r=record(i%2?' MARCO ':'Marco',car),id=i.toString(16).padStart(64,'0');db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,'track',car,1200+i,JSON.stringify(r),100+i,driverKey(r,id),'not_assessed');db.prepare(retainRunHistorySQL).run(GLOBAL_SCORE_RULES,'track');db.prepare(pruneRunHistorySQL).run(GLOBAL_SCORE_RULES,'track',GLOBAL_SCORE_RULES,'track');db.prepare(pruneCarScoresSQL).run(GLOBAL_SCORE_RULES,'track',GLOBAL_SCORE_RULES,'track');}
 assert.deepEqual(db.prepare('SELECT created_at FROM run_history ORDER BY created_at DESC').all().map(r=>r.created_at),[107,106,105,104,103]);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM global_scores').get()!.n,2);
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return db.prepare(sql).get(...args as never[]);},async all(){return {results:db.prepare(sql).all(...args as never[])}}};}};
 const source=readFileSync(new URL('../app/api/run-history/route.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const get=new Function('readRaceEngine','engineScopedRanking','engineScorePredicate','env','GLOBAL_SCORE_RULES','scoreString','driverKey','resolvedDriverSQL','combinedCarScoresSQL','publicScoreName',stripTypeScriptTypes(source)+';return GET;')(readRaceEngine,engineScopedRanking,engineScorePredicate,{DB:binding},GLOBAL_SCORE_RULES,scoreString,driverKey,resolvedDriverSQL,combinedCarScoresSQL,publicScoreName) as (r:Request)=>Promise<Response>;
 return (async()=>{
  const history=async(id:string)=>{const response=await get(new Request('https://example.test/api/run-history?score='+id));assert.equal(response.status,200);return await response.json() as {runs:{id:string;postedAt:number;ranked:boolean;carCode:string}[]};};
  const body=await history('0'.repeat(64));assert.deepEqual(body.runs.map(r=>r.postedAt),[107,106,105,104,103]);assert.ok(body.runs.every(r=>!r.ranked));assert.equal(new Set(body.runs.map(r=>r.carCode)).size,2);
  const oldScores=db.prepare('SELECT * FROM global_scores ORDER BY id').all(),oldHistory=db.prepare('SELECT * FROM run_history ORDER BY id').all();
  const modernIds:string[]=[];
  for(let i=0;i<7;i++){
   const id=('e'+i.toString(16)).padEnd(64,'0'),r=record(' MARCO ','PMIN');modernIds.push(id);
   db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,'track','PMIN',1100+i,JSON.stringify(r),200+i,driverKey(r,id),'not_assessed');
   db.prepare('INSERT INTO race_engines VALUES (?,?)').run(id,'ms-1991');
  }
  assert.deepEqual((await history('0'.repeat(64))).runs,body.runs,'newer same-name runs must not enter legacy history or change ranked flags');
  const modern=await history(modernIds[0]);assert.deepEqual(modern.runs.map(r=>r.postedAt),[206,205,204,203,202]);assert.ok(modern.runs.every(r=>modernIds.includes(r.id)));assert.ok(modern.runs.every(r=>!r.ranked));
  assert.deepEqual(db.prepare("SELECT * FROM global_scores WHERE id NOT LIKE 'e%' ORDER BY id").all(),oldScores);
  assert.deepEqual(db.prepare('SELECT * FROM run_history ORDER BY id').all(),oldHistory);
  assert.equal((await get(new Request('https://example.test/api/run-history?score=invalid'))).status,400);assert.equal((await get(new Request('https://example.test/api/run-history?score='+('f'.repeat(64))))).status,404);db.close();
 })();
});
test('empty and censored display names are not merged as identities',()=>{assert.notEqual(driverKey(record('','PMIN'),'a'),driverKey(record('','PMIN'),'b'));assert.notEqual(driverKey(record('FUCK','PMIN'),'a'),driverKey(record('SHIT','PMIN'),'b'));assert.equal(driverKey(record(' Marco ','PMIN'),'a'),driverKey(record('MARCO','FGTO'),'b'));});
