/** Execute the shipped DOS-table GET endpoint against a migrated local DB. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {GLOBAL_SCORE_RULES,scoreString,sharedScoreFile,scoreTicks} from '../lib/game/global-score-format.ts';
import {publicScoreName} from '../lib/game/public-score-name.ts';
import {engineScopedRanking,engineScorePredicate} from '../lib/server/engine-scoped-ranking.ts';
import {rankedScoresSQL,bestCarScoresSQL,categoryCarScoresSQL,categoryScoresSQL,combinedCarScoresSQL,driverKey,resolvedDriverSQL} from '../lib/server/leaderboard-ranking.ts';
import {readRaceEngine} from '../lib/server/race-engine-metadata.ts';
import {resolvePhysicsEngine} from '../lib/physics/engine-version.ts';
test('history endpoint selects the anchor engine before the five-run cap and rank flags',async()=>{
 const db=new DatabaseSync(':memory:');
 for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(name=>name.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 const engines=['ms-1990','ms-1991','bb-1991'] as const,ids=new Map<string,string[]>(),hash='a'.repeat(64);
 for(const [ei,engine] of engines.entries()){
  const records=[];
  for(let attempt=0;attempt<7;attempt++){
   const id=(ei*100+attempt+1).toString(16).padStart(64,'0'),record=Array(52).fill(0);record[0]=77;
   const values=[id,GLOBAL_SCORE_RULES,hash,'PMIN',1200-ei*300+attempt,JSON.stringify(record),ei*100+attempt,'name:m','full_route'];
   db.prepare('INSERT INTO run_history VALUES (?,?,?,?,?,?,?,?,?)').run(...values);
   if(attempt===6)db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(...values);
   if(attempt===5)db.prepare('INSERT INTO shared_replays(id,replay,track_name,created_at) VALUES (?,?,?,?)').run(id,'[]','TEST',1);
   if(engine!=='ms-1990')db.prepare('INSERT INTO race_engines VALUES (?,?)').run(id,engine);
   records.push(id);
  }
  ids.set(engine,records);
 }
 const tables=['global_scores','run_history','shared_replays','race_engines'];
 const snapshot=()=>tables.map(table=>db.prepare('SELECT * FROM '+table+' ORDER BY id').all()),before=snapshot();
 const binding={prepare(query:string){assert.match(query,/^(SELECT|WITH) /);let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return db.prepare(query).get(...args as never[]);},async all(){return {results:db.prepare(query).all(...args as never[])};}};}};
 const source=readFileSync(new URL('../app/api/run-history/route.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const deps={env:{DB:binding},GLOBAL_SCORE_RULES,scoreString,driverKey,resolvedDriverSQL,combinedCarScoresSQL,publicScoreName,readRaceEngine,engineScopedRanking,engineScorePredicate};
 const GET=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return GET;')(...Object.values(deps)) as (request:Request)=>Promise<Response>;
 for(const engine of engines){
  const own=ids.get(engine)!;
  for(const anchor of [own[0],own[6]]){
   const response=await GET(new Request('https://test.example/api/run-history?score='+anchor+'&engine=ms-1991&play-engine=ms-1990'));
   assert.equal(response.status,200);
   const body=await response.json() as {runs:{id:string;ranked:boolean;replay:boolean}[]};
   assert.deepEqual(body.runs.map(run=>run.id),own.slice(2).reverse(),'Newer runs from other engines cannot displace this engine history');
   assert.deepEqual(body.runs.filter(run=>run.ranked).map(run=>run.id),[own[6]]);
   assert.deepEqual(body.runs.filter(run=>run.replay).map(run=>run.id),[own[5]]);
  }
 }
 assert.equal((await GET(new Request('https://test.example/api/run-history?score='+'f'.repeat(64)))).status,404);
 assert.equal((await GET(new Request('https://test.example/api/run-history?score=invalid'))).status,400);
 assert.deepEqual(snapshot(),before,'History reads must preserve every stored byte and engine tag');db.close();
});

test('shipped score reads select engine before ranking and never mutate retained data',async()=>{
 const db=new DatabaseSync(':memory:');
 for(const name of readdirSync(new URL('../drizzle/',import.meta.url)).filter(name=>name.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+name,import.meta.url),'utf8'));
 const hash='a'.repeat(64),categories=['full_route','shortcuts_detected','not_assessed'],engines=['ms-1990','ms-1991','bb-1991'] as const,cars=['PMIN','COUN'];
 const expected=new Map<string,number>();
 for(const [ei,engine] of engines.entries())for(const [ci,category] of categories.entries())for(const [carIndex,car] of cars.entries()){
  const id=(ei*100+ci*10+carIndex).toString(16).padStart(64,'0'),ticks=1200-ei*300-ci*50+carIndex*10,record=Array(52).fill(0);
  for(const [index,char] of [...'Same driver'].entries())record[index]=char.charCodeAt(0);
  for(const [index,char] of [...car].entries())record[17+index]=char.charCodeAt(0);
  record[50]=ticks&255;record[51]=ticks>>8;
  db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)').run(id,GLOBAL_SCORE_RULES,hash,car,ticks,JSON.stringify(record),1,'name:same driver',category);
  if(engine!=='ms-1990')db.prepare('INSERT INTO race_engines VALUES (?,?)').run(id,engine);
  expected.set([engine,category,car].join(':'),ticks);
 }
 const before={scores:db.prepare('SELECT * FROM global_scores ORDER BY id').all(),engines:db.prepare('SELECT * FROM race_engines ORDER BY id').all()};
 let reads=0;
 const binding={prepare(sql:string){assert.match(sql,/^SELECT /);reads++;let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async all(){return {results:db.prepare(sql).all(...args as never[])}}};}};
 const source=readFileSync(new URL('../app/api/highscores/route.ts',import.meta.url),'utf8').split('export async function POST')[0].replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const deps={env:{DB:binding},GLOBAL_SCORE_RULES,scoreString,sharedScoreFile,publicScoreName,engineScopedRanking,rankedScoresSQL,bestCarScoresSQL,categoryCarScoresSQL,categoryScoresSQL,resolvePhysicsEngine};
 const GET=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return GET;')(...Object.values(deps)) as (request:Request)=>Promise<Response>;
 for(const engine of engines)for(const category of [undefined,...categories])for(const car of [undefined,...cars]){
  const params=new URLSearchParams({track:hash,engine,'play-engine':'bb-1991','preview-engine':'ms-1991'});
  if(category)params.set('category',category);if(car)params.set('car',car);
  const response=await GET(new Request('https://test.example/api/highscores?'+params));
  assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
  const body=await response.json() as {file:number[]};assert.equal(body.file.length,364);
  assert.equal(scoreTicks(body.file),expected.get([engine,category??'not_assessed',car??'PMIN'].join(':')));
 }
 const legacy=await GET(new Request('https://test.example/api/highscores?track='+hash+'&play-engine=ms-1991'));
 assert.equal(scoreTicks((await legacy.json() as {file:number[]}).file),expected.get('ms-1990:not_assessed:PMIN'));
 const beforeInvalid=reads;
 assert.equal((await GET(new Request('https://test.example/api/highscores?track='+hash+'&engine=latest'))).status,400);
 assert.equal(reads,beforeInvalid,'Unknown engine must fail before a DB query');
 assert.deepEqual(db.prepare('SELECT * FROM global_scores ORDER BY id').all(),before.scores);
 assert.deepEqual(db.prepare('SELECT * FROM race_engines ORDER BY id').all(),before.engines);
 db.close();
});
