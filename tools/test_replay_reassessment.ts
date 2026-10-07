import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {currentCarScoresSQL,pruneCarScoresSQL,retainAcceptedScoresSQL,driverKey} from '../lib/server/leaderboard-ranking.ts';
import {GLOBAL_SCORE_RULES,scoreString} from '../lib/game/global-score-format.ts';
import {ROUTE_ASSESSMENT_VERSION} from '../lib/server/route-assessment-version.ts';
import {retainRunHistorySQL,pruneRunHistorySQL} from '../lib/server/run-history.ts';

// Execute the production handler against SQLite. Only native verification and
// asset loading are stubbed here; separate native-fixture tests cover verification.
test('sharing reassesses before ranking and restores only server-accepted proofs',async()=>{
 const db=new DatabaseSync(':memory:');
 for(const name of ['0000_same_the_executioner','0001_friendly_wolfsbane','0002_bitter_joshua_kane','0003_cooing_blue_blade','0004_tricky_aaron_stack','0005_dark_silhouette','0006_lazy_colleen_wing','0007_smooth_puff_adder','0008_past_nova'])db.exec(readFileSync(new URL('../drizzle/'+name+'.sql',import.meta.url),'utf8'));
 const binding={prepare(sql:string){let args:unknown[]=[];return {bind(...values:unknown[]){args=values;return this;},async first(){return db.prepare(sql).get(...args as never[]);},async all(){return {results:db.prepare(sql).all(...args as never[])};},run(){return db.prepare(sql).run(...args as never[]);}};},async batch(statements:{run:()=>unknown}[]){db.exec('BEGIN');try{const rows=statements.map(s=>s.run());db.exec('COMMIT');return rows;}catch(e){db.exec('ROLLBACK');throw e;}}};
 const record=Array(52).fill(0);record[0]=77;
 let verified={id:'accepted',trackHash:'track',carCode:'PMIN',ticks:100,record,routeAssessment:'full_route',replay:new Uint8Array(2000)};
 const source=readFileSync(new URL('../app/api/replays/route.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export async function/g,'async function');
 const create=new Function('env','GLOBAL_SCORE_RULES','scoreHash','scoreString','verifyGlobalScore','globalScoreData','publicScoreName','currentCarScoresSQL','pruneCarScoresSQL','retainAcceptedScoresSQL','driverKey','ROUTE_ASSESSMENT_VERSION','retainRunHistorySQL','pruneRunHistorySQL',stripTypeScriptTypes(source)+';return POST;');
 const post=create({DB:binding,ASSETS:{}},GLOBAL_SCORE_RULES,async()=> 'bucket',scoreString,async()=>verified,async()=>({}),(s:string)=>s,currentCarScoresSQL,pruneCarScoresSQL,retainAcceptedScoresSQL,driverKey,ROUTE_ASSESSMENT_VERSION,retainRunHistorySQL,pruneRunHistorySQL) as (r:Request)=>Promise<Response>;
 const share=()=>post(new Request('https://example.test/api/replays',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Replay':'share'},body:JSON.stringify({replay:Array(24).fill(0)})}));
 const insert=db.prepare('INSERT INTO global_scores VALUES (?,?,?,?,?,?,?,?,?)');
 for(let i=0;i<7;i++)insert.run('fast'+i,GLOBAL_SCORE_RULES,'track','PMIN',10+i,'[]',1+i,'name:driver'+i,'not_assessed');
 insert.run('accepted',GLOBAL_SCORE_RULES,'track','PMIN',100,JSON.stringify(record),9,'name:m','not_assessed');
 assert.equal(db.prepare('SELECT id FROM ('+currentCarScoresSQL+") WHERE id='accepted'").get(),undefined,'Old category rank is outside seven');
 assert.equal((await share()).status,200,'Current accepted row may move into full route before rank check');
 assert.equal(db.prepare("SELECT route_assessment,created_at FROM global_scores WHERE id='accepted'").get()!.route_assessment,'full_route');
 assert.equal(db.prepare("SELECT created_at FROM accepted_scores WHERE id='accepted'").get()!.created_at,9);
 db.exec("DELETE FROM shared_replays WHERE id='accepted'; DELETE FROM global_scores WHERE id='accepted'");
 assert.equal((await share()).status,200,'Receipt restores a displaced accepted score');
 assert.equal(db.prepare("SELECT assessment_version FROM shared_replays WHERE id='accepted'").get()!.assessment_version,ROUTE_ASSESSMENT_VERSION,'Manual sharing already verified this version');
 assert.equal(db.prepare("SELECT created_at FROM global_scores WHERE id='accepted'").get()!.created_at,9);
 verified={...verified,id:'unsubmitted'};
 assert.equal((await share()).status,422,'Arbitrary valid replay cannot create a score');
 assert.equal(db.prepare("SELECT id FROM global_scores WHERE id='unsubmitted'").get(),undefined);
 verified={...verified,id:'accepted',routeAssessment:'not_assessed'};
 assert.equal((await share()).status,422,'Reassessment cannot bypass its new category top seven');
 assert.equal(db.prepare("SELECT id FROM shared_replays WHERE id='accepted'").get(),undefined);
 assert.ok(db.prepare("SELECT id FROM accepted_scores WHERE id='accepted'").get(),'Receipt survives displacement');
 db.close();
});
