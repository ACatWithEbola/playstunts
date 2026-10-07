import type {NativeDemoData} from '../game/native-demo-runtime.ts';
import {GLOBAL_SCORE_RULES} from '../game/global-score-format.ts';
import {verifyGlobalScore} from './verify-global-score.ts';
import {ROUTE_ASSESSMENT_VERSION} from './route-assessment-version.ts';
import {pruneCarScoresSQL,retainAcceptedScoresSQL} from './leaderboard-ranking.ts';
import {retainRunHistorySQL,pruneRunHistorySQL} from './run-history.ts';
import {replayScoresSQL,pruneSharedReplaysSQL} from './shared-replay-retention.ts';

const pendingSQL='SELECT COUNT(*) AS pending FROM shared_replays r JOIN ('+replayScoresSQL+') s ON s.id=r.id WHERE s.rules=? AND r.assessment_version<>?';
/** One public, already accepted recording per request. A database-wide lease
 * prevents concurrent visitors duplicating native replay work. No submissions,
 * private recordings, times, driver identities or posting dates are rewritten. */
export async function reassessNextPublicReplay(db:D1Database,load:()=>Promise<NativeDemoData>,verify=verifyGlobalScore){
 const pending=async()=> (await db.prepare(pendingSQL).bind(GLOBAL_SCORE_RULES,ROUTE_ASSESSMENT_VERSION).first<{pending:number}>())?.pending??0;
 if(!await pending())return {state:'idle',pending:0,changed:false};
 const now=Math.floor(Date.now()/1000),token=crypto.randomUUID();
 const lock=await db.prepare('INSERT INTO replay_assessment_lock(key,token,lease_until) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET token=excluded.token,lease_until=excluded.lease_until WHERE replay_assessment_lock.lease_until<=? RETURNING token').bind('public-replays',token,now+120,now).first();
 if(!lock)return {state:'busy',pending:await pending(),changed:false};
 let selected:string|undefined;
 try{
  const row=await db.prepare('SELECT r.id,r.replay,s.record,s.ticks,s.track_hash,s.car_code FROM shared_replays r JOIN ('+replayScoresSQL+') s ON s.id=r.id WHERE s.rules=? AND r.assessment_version<>? AND r.assessment_retry_at<=? ORDER BY r.assessment_retry_at,r.created_at,r.id LIMIT 1').bind(GLOBAL_SCORE_RULES,ROUTE_ASSESSMENT_VERSION,now).first<{id:string;replay:string;record:string;ticks:number;track_hash:string;car_code:string}>();
  if(!row)return {state:'idle',pending:await pending(),changed:false};
  selected=row.id;
  const result=await verify({record:JSON.parse(row.record),replay:JSON.parse(row.replay),rules:GLOBAL_SCORE_RULES,flags:1,continued:false},await load());
  if(result.id!==row.id||result.ticks!==row.ticks||result.trackHash!==row.track_hash||result.carCode!==row.car_code)throw Error('Public replay does not match its accepted score');
  const finished=Math.floor(Date.now()/1000);
  const owns=await db.prepare('SELECT token FROM replay_assessment_lock WHERE key=? AND token=? AND lease_until>?').bind('public-replays',token,finished).first();
  if(!owns)return {state:'busy',pending:await pending(),changed:false};
  await db.batch([
   db.prepare('UPDATE global_scores SET route_assessment=? WHERE id=? AND rules=? AND EXISTS (SELECT 1 FROM replay_assessment_lock WHERE key=? AND token=?)').bind(result.routeAssessment,row.id,GLOBAL_SCORE_RULES,'public-replays',token),
   db.prepare('UPDATE shared_replays SET assessment_version=?,assessed_at=?,assessment_retry_at=0 WHERE id=? AND EXISTS (SELECT 1 FROM replay_assessment_lock WHERE key=? AND token=?)').bind(ROUTE_ASSESSMENT_VERSION,finished,row.id,'public-replays',token),
   db.prepare(retainAcceptedScoresSQL).bind(GLOBAL_SCORE_RULES,row.track_hash),
   db.prepare('UPDATE run_history SET route_assessment=? WHERE id=?').bind(result.routeAssessment,row.id),
   db.prepare(retainRunHistorySQL).bind(GLOBAL_SCORE_RULES,row.track_hash),
   db.prepare(pruneRunHistorySQL).bind(GLOBAL_SCORE_RULES,row.track_hash,GLOBAL_SCORE_RULES,row.track_hash),
   db.prepare(pruneCarScoresSQL).bind(GLOBAL_SCORE_RULES,row.track_hash,GLOBAL_SCORE_RULES,row.track_hash),
   db.prepare(pruneSharedReplaysSQL),
  ]);
  return {state:'updated',pending:await pending(),changed:true};
 }catch(error){
  console.warn('Public replay reassessment deferred',selected,error instanceof Error?error.message:'Unknown failure');
  if(selected)await db.prepare('UPDATE shared_replays SET assessment_retry_at=? WHERE id=? AND assessment_version<>?').bind(now+3600,selected,ROUTE_ASSESSMENT_VERSION).run();
  return {state:'retry',pending:await pending(),changed:false};
 }finally{
  await db.prepare('DELETE FROM replay_assessment_lock WHERE key=? AND token=?').bind('public-replays',token).run();
 }
}
