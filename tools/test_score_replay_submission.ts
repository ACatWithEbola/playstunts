import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import * as ranking from '../lib/server/leaderboard-ranking.ts';
import {retainRunHistorySQL,pruneRunHistorySQL} from '../lib/server/run-history.ts';
import {pruneSharedReplaysSQL} from '../lib/server/shared-replay-retention.ts';
import {ROUTE_ASSESSMENT_VERSION} from '../lib/server/route-assessment-version.ts';
import {GLOBAL_SCORE_RULES,scoreString,sharedScoreFile} from '../lib/game/global-score-format.ts';

test('score submission requires consent and atomically retains its public recording',async()=>{
 const db=new DatabaseSync(':memory:');
 for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())db.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
 let fail=false;
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return db.prepare(sql).get(...args as never[]);},async all(){return {results:db.prepare(sql).all(...args as never[])};},run(){if(fail&&sql.startsWith('INSERT OR IGNORE INTO shared_replays'))throw Error('Storage unavailable');return db.prepare(sql).run(...args as never[]);}};},async batch(statements:{run:()=>unknown}[]){db.exec('BEGIN');try{const rows=statements.map(s=>s.run());db.exec('COMMIT');return rows;}catch(e){db.exec('ROLLBACK');throw e;}}};
 const record=Array(52).fill(0);record[0]=65;record[50]=100;
 let verified={id:'a'.repeat(64),trackHash:'b'.repeat(64),carCode:'PMIN',ticks:100,record,routeAssessment:'full_route',replay:new Uint8Array(2000)};
 const source=readFileSync(new URL('../app/api/highscores/route.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const deps={env:{DB:binding,ASSETS:{}},GLOBAL_SCORE_RULES,scoreHash:async()=> 'bucket',scoreString,validateScoreSubmission:()=>{},sharedScoreFile,publicScoreName:(s:string)=>s,verifyGlobalScore:async()=>verified,globalScoreData:async()=>({}),retainRunHistorySQL,pruneRunHistorySQL,pruneSharedReplaysSQL,ROUTE_ASSESSMENT_VERSION,...ranking};
 const post=new Function(...Object.keys(deps),stripTypeScriptTypes(source)+';return POST;')(...Object.values(deps)) as (r:Request)=>Promise<Response>;
 const send=(consent:boolean)=>post(new Request('https://example.test/api/highscores',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES},body:JSON.stringify({replay:Array(24).fill(0),publicReplayConsent:consent})}));
 assert.equal((await send(false)).status,422);assert.equal(db.prepare('SELECT COUNT(*) AS n FROM global_scores').get()!.n,0);
 assert.equal((await send(true)).status,200);assert.ok(db.prepare('SELECT id FROM shared_replays WHERE id=?').get(verified.id));
 verified={...verified,id:'c'.repeat(64)};fail=true;
 assert.equal((await send(true)).status,503);assert.equal(db.prepare('SELECT id FROM accepted_scores WHERE id=?').get(verified.id),undefined);assert.equal(db.prepare('SELECT id FROM global_scores WHERE id=?').get(verified.id),undefined);
 db.close();
});
