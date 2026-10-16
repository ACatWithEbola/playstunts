import type {NativeDemoData} from '../game/native-demo-runtime.ts';
import {GLOBAL_SCORE_RULES} from '../game/global-score-format.ts';
import {verifyGlobalScore} from './verify-global-score.ts';
import {ROUTE_ASSESSMENT_VERSION} from './route-assessment-version.ts';
import {retainAcceptedScoresSQL} from './leaderboard-ranking.ts';
import {retainRunHistorySQL} from './run-history.ts';
import {replayScoresSQL} from './shared-replay-retention.ts';
import {readRaceEngine} from './race-engine-metadata.ts';

const pendingSQL='SELECT COUNT(*) AS pending FROM shared_replays r JOIN ('+replayScoresSQL+') s ON s.id=r.id WHERE s.rules=? AND r.assessment_version<>?';
/** One public, already accepted recording per request. A database-wide lease
 * prevents concurrent visitors duplicating native replay work. No submissions,
 * private recordings, times, driver identities or posting dates are rewritten. */
export async function reassessNextPublicReplay(db:D1Database,load:()=>Promise<NativeDemoData>,verify=verifyGlobalScore,targetId?:string){
 if(targetId!==undefined&&!/^[a-f0-9]{64}$/.test(targetId))throw Error('Invalid public replay ID');
 const target=targetId===undefined?'':' AND r.id=?',targetArgs=targetId===undefined?[]:[targetId];
 const pending=async()=> (await db.prepare(pendingSQL+target).bind(GLOBAL_SCORE_RULES,ROUTE_ASSESSMENT_VERSION,...targetArgs).first<{pending:number}>())?.pending??0;
 if(!await pending())return {state:'idle',pending:0,changed:false};
 const now=Math.floor(Date.now()/1000),token=crypto.randomUUID();
 const lock=await db.prepare('INSERT INTO replay_assessment_lock(key,token,lease_until) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET token=excluded.token,lease_until=excluded.lease_until WHERE replay_assessment_lock.lease_until<=? RETURNING token').bind('public-replays',token,now+120,now).first();
 if(!lock)return {state:'busy',pending:await pending(),changed:false};
 let selected:string|undefined;
 try{
  const row=await db.prepare('SELECT r.id,r.replay,s.record,s.ticks,s.track_hash,s.car_code FROM shared_replays r JOIN ('+replayScoresSQL+') s ON s.id=r.id WHERE s.rules=? AND r.assessment_version<>? AND r.assessment_retry_at<=?'+target+' ORDER BY r.assessment_retry_at,r.created_at,r.id LIMIT 1').bind(GLOBAL_SCORE_RULES,ROUTE_ASSESSMENT_VERSION,now,...targetArgs).first<{id:string;replay:string;record:string;ticks:number;track_hash:string;car_code:string}>();
  if(!row)return {state:'idle',pending:await pending(),changed:false};
  selected=row.id;
  const physicsEngine=await readRaceEngine(db,row.id);
  const result=await verify({physicsEngine,record:JSON.parse(row.record),replay:JSON.parse(row.replay),rules:GLOBAL_SCORE_RULES,flags:1,continued:false},await load());
  if(result.id!==row.id||result.ticks!==row.ticks||result.trackHash!==row.track_hash||result.carCode!==row.car_code)throw Error('Public replay does not match its accepted score');
  const finished=Math.floor(Date.now()/1000);
  const owns=await db.prepare('SELECT token FROM replay_assessment_lock WHERE key=? AND token=? AND lease_until>?').bind('public-replays',token,finished).first();
  if(!owns)return {state:'busy',pending:await pending(),changed:false};
  const guard=(query:string)=>query+' AND EXISTS (SELECT 1 FROM replay_assessment_lock WHERE key=? AND token=?)';
  const committed=await db.batch([
   db.prepare('UPDATE global_scores SET route_assessment=? WHERE id=? AND rules=? AND EXISTS (SELECT 1 FROM replay_assessment_lock WHERE key=? AND token=?)').bind(result.routeAssessment,row.id,GLOBAL_SCORE_RULES,'public-replays',token),
   db.prepare('UPDATE shared_replays SET assessment_version=?,assessed_at=?,assessment_retry_at=0,assessment_reason=? WHERE id=? AND EXISTS (SELECT 1 FROM replay_assessment_lock WHERE key=? AND token=?)').bind(ROUTE_ASSESSMENT_VERSION,finished,result.assessmentReason??'',row.id,'public-replays',token),
   db.prepare(guard(retainAcceptedScoresSQL)).bind(GLOBAL_SCORE_RULES,row.track_hash,'public-replays',token),
   db.prepare(guard('UPDATE run_history SET route_assessment=? WHERE id=?')).bind(result.routeAssessment,row.id,'public-replays',token),
   db.prepare(guard(retainRunHistorySQL)).bind(GLOBAL_SCORE_RULES,row.track_hash,'public-replays',token),
   // Reclassification is not an insertion. Preserve all existing scores,
   // recordings and history, even if two retained runs now share a category.
   // Display ranking deduplicates them without deleting either proof.
  ]);
  if(!committed[1].meta.changes)return {state:'busy',pending:await pending(),changed:false};
  return {state:'updated',pending:await pending(),changed:true};
 }catch(error){
  console.warn('Public replay reassessment deferred',selected,error instanceof Error?error.message:'Unknown failure');
  if(selected)await db.prepare('UPDATE shared_replays SET assessment_retry_at=? WHERE id=? AND assessment_version<>? AND EXISTS (SELECT 1 FROM replay_assessment_lock WHERE key=? AND token=?)').bind(now+3600,selected,ROUTE_ASSESSMENT_VERSION,'public-replays',token).run();
  return {state:'retry',pending:await pending(),changed:false};
 }finally{
  await db.prepare('DELETE FROM replay_assessment_lock WHERE key=? AND token=?').bind('public-replays',token).run();
 }
}
