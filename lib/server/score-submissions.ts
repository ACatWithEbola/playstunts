import {scoreHash,scoreString,scoreTicks,validateScoreSubmission,GLOBAL_SCORE_RULES} from '../game/global-score-format.ts';
import {publicScoreName} from '../game/public-score-name.ts';
import {resolvePhysicsEngine} from '../physics/engine-version.ts';
import {validateReplayEncoding} from '../game/upload-validation.ts';
import {communityTrackWithdrawn,withdrawnCommunityTracks} from './withdrawn-community-tracks.ts';

export type SubmissionRow={id:string;submission:string;track_hash:string;track_name:string;car_code:string;ticks:number;record:string;physics_engine:string;state:string;created_at:number;updated_at:number;retry_at:number;verified_id:string|null;error:string};
export function publicSubmission(row:SubmissionRow){
 const record=JSON.parse(row.record) as number[];
 return {id:row.id,trackHash:row.track_hash,track:publicScoreName(row.track_name),driver:publicScoreName(scoreString(record,0,17)),carCode:row.car_code,car:publicScoreName(scoreString(record,17,41)||row.car_code),ticks:row.ticks,physicsEngine:resolvePhysicsEngine(row.physics_engine),state:row.state,postedAt:row.created_at,verifiedId:row.verified_id,error:row.error};
}
export async function queueScoreSubmission(db:D1Database,raw:unknown,ip:string,now=Math.floor(Date.now()/1000)){
 const v=validateScoreSubmission(raw);if((raw as {publicReplayConsent?:unknown}).publicReplayConsent!==true)throw Error('Public replay consent is required to submit a high score');
 const engine=resolvePhysicsEngine(v.physicsEngine),replay=Uint8Array.from(v.replay);validateReplayEncoding(replay,30000);
 const proof={record:[...v.record],replay:[...v.replay],continued:false,flags:1,rules:GLOBAL_SCORE_RULES,physicsEngine:engine,publicReplayConsent:true};
 const payload=JSON.stringify(proof),id=await scoreHash(new TextEncoder().encode(payload));
 const retained=await db.prepare('SELECT * FROM score_submissions WHERE id=?').bind(id).first<SubmissionRow>();
 if(retained)return retained; // An uncertain response/reload never creates a duplicate.
 const hash=await scoreHash(replay.slice(24,0x722));if(communityTrackWithdrawn(hash))throw Error('This track has been withdrawn from community sharing.');
 const bucket='queued:'+await scoreHash(new TextEncoder().encode(ip+':'+Math.floor(now/3600)));
 const limit=await db.prepare('INSERT INTO score_requests(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+7200).first<{count:number}>();
 if(!limit||limit.count>20)throw Error('Submission limit reached; try later');
 const name=scoreString(v.replay,13,22),trackName=/^[A-Za-z0-9_-]{1,8}$/.test(name)?name.toUpperCase():'Track '+hash.slice(0,8).toUpperCase();
 const shared=await db.prepare('SELECT name FROM shared_tracks WHERE hash=?').bind(hash).first<{name:string}>();
 await db.prepare('INSERT OR IGNORE INTO score_submissions(id,submission,track_hash,track_name,car_code,ticks,record,physics_engine,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,payload,hash,shared?.name??trackName,String.fromCharCode(...replay.slice(0,4)),scoreTicks(v.record),JSON.stringify(v.record),engine,now,now).run();
 return (await db.prepare('SELECT * FROM score_submissions WHERE id=?').bind(id).first<SubmissionRow>())!;
}
export async function publicSubmissionRows(db:D1Database,now=Math.floor(Date.now()/1000)){
 const result=await db.prepare("SELECT * FROM score_submissions WHERE state<>'accepted' AND (state<>'rejected' OR updated_at>?) AND track_hash NOT IN (SELECT value FROM json_each(?)) ORDER BY created_at DESC,id LIMIT 50").bind(now-900,JSON.stringify(withdrawnCommunityTracks)).all<SubmissionRow>();
 return result.results;
}
/** One leased server verification at a time. The existing acceptance handler
 * remains the only writer of ranked scores, receipts and public replays. */
export async function processScoreSubmission(db:D1Database,accept:(raw:unknown)=>Promise<Response>,target?:string,now=Math.floor(Date.now()/1000)){
 if(target!==undefined&&!/^[a-f0-9]{64}$/.test(target))throw Error('Invalid submission ID');
 const token=crypto.randomUUID(),lock=await db.prepare('INSERT INTO replay_assessment_lock(key,token,lease_until) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET token=excluded.token,lease_until=excluded.lease_until WHERE replay_assessment_lock.lease_until<=? RETURNING token').bind('score-submissions',token,now+120,now).first();
 if(!lock)return {state:'busy'};
 let selected:string|undefined;
 try{
  const row=await db.prepare("SELECT * FROM score_submissions WHERE state IN ('queued','verifying','retry') AND retry_at<=?"+(target?' AND id=?':'')+' ORDER BY created_at,id LIMIT 1').bind(now,...(target?[target]:[])).first<SubmissionRow>();
  if(!row)return {state:'idle'};selected=row.id;
  await db.prepare("UPDATE score_submissions SET state='verifying',updated_at=?,retry_at=? WHERE id=?").bind(now,now+120,row.id).run();
  const response=await accept(JSON.parse(row.submission)),result=await response.json() as {accepted?:boolean;id?:string;error?:string};
  const finished=Math.floor(Date.now()/1000);
  const owns=await db.prepare('SELECT token FROM replay_assessment_lock WHERE key=? AND token=?').bind('score-submissions',token).first();
  if(!owns)return {state:'busy'};
  if(response.ok&&result.accepted&&/^[a-f0-9]{64}$/.test(result.id??'')){
   // Recover safely if acceptance committed but the queue status write failed.
   const receipt=await db.prepare('SELECT id FROM accepted_scores WHERE id=? AND rules=?').bind(result.id,GLOBAL_SCORE_RULES).first();
   if(!receipt)throw Error('Acceptance receipt unavailable');
   await db.prepare("UPDATE score_submissions SET state='accepted',verified_id=?,error='',updated_at=?,retry_at=0 WHERE id=?").bind(result.id,finished,row.id).run();
   return {state:'accepted',id:row.id,verifiedId:result.id};
  }
  const rejected=[400,403,413,422].includes(response.status);
  await db.prepare('UPDATE score_submissions SET state=?,error=?,updated_at=?,retry_at=? WHERE id=?').bind(rejected?'rejected':'retry',rejected?'This run could not be verified. A copy is retained.':'Verification is delayed. It will retry automatically.',finished,finished+(response.status===429?3600:30),row.id).run();
  return {state:rejected?'rejected':'retry',id:row.id};
 }catch(error){
  if(selected)await db.prepare("UPDATE score_submissions SET state='retry',error=?,updated_at=?,retry_at=? WHERE id=? AND EXISTS (SELECT 1 FROM replay_assessment_lock WHERE key=? AND token=?)").bind('Verification is delayed. It will retry automatically.',now,now+30,selected,'score-submissions',token).run();
  console.warn('Queued verification deferred',selected,error instanceof Error?error.message:'Unknown failure');return {state:'retry'};
 }finally{await db.prepare('DELETE FROM replay_assessment_lock WHERE key=? AND token=?').bind('score-submissions',token).run();}
}
