import {env} from 'cloudflare:workers';
import {GLOBAL_SCORE_RULES,scoreHash,scoreString} from '@/lib/game/global-score-format';
import {verifyGlobalScore} from '@/lib/server/verify-global-score';
import {globalScoreData} from '@/lib/server/global-score-data';
import {publicScoreName} from '@/lib/game/public-score-name';
import {currentCarScoresSQL,pruneCarScoresSQL,retainAcceptedScoresSQL,driverKey} from '@/lib/server/leaderboard-ranking';
import {ROUTE_ASSESSMENT_VERSION} from '@/lib/server/route-assessment-version';
import {retainRunHistorySQL,pruneRunHistorySQL} from '@/lib/server/run-history';
import {replayScoresSQL,pruneSharedReplaysSQL} from '@/lib/server/shared-replay-retention';
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const bindings=()=>env as unknown as {DB:D1Database;ASSETS:Fetcher};
export async function GET(request:Request){
 const url=new URL(request.url),id=url.searchParams.get('id'),track=url.searchParams.get('track');
 if((id&&!/^[a-f0-9]{64}$/.test(id))||(track&&!/^[a-f0-9]{64}$/.test(track)))return reply({error:'Invalid replay or track'},400);
 try{
  const db=bindings().DB;
  if(id){const row=await db.prepare('SELECT r.replay,s.track_hash FROM shared_replays r JOIN ('+replayScoresSQL+') s ON s.id=r.id WHERE r.id=? AND s.rules=?').bind(id,GLOBAL_SCORE_RULES).first<{replay:string;track_hash:string}>();if(!row)return reply({error:'Replay not found'},404);
   const bytes=Uint8Array.from(JSON.parse(row.replay) as number[]),name='T'+row.track_hash.slice(0,7).toUpperCase();bytes.fill(0,13,22);bytes.set(Array.from(name,c=>c.charCodeAt(0)),13);
   return new Response(bytes,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="R${id.slice(0,7).toUpperCase()}.RPL"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  const result=await db.prepare('SELECT s.id,s.track_hash,s.car_code,s.ticks,s.record,r.track_name,r.created_at FROM shared_replays r JOIN ('+replayScoresSQL+') s ON s.id=r.id WHERE s.rules=?'+(track?' AND s.track_hash=?':'')+' ORDER BY r.created_at DESC,s.id LIMIT 50').bind(...(track?[GLOBAL_SCORE_RULES,track]:[GLOBAL_SCORE_RULES])).all<{id:string;track_hash:string;car_code:string;ticks:number;record:string;track_name:string;created_at:number}>();
  return reply({replays:result.results.map(row=>({id:row.id,track:row.track_hash,car:scoreString(JSON.parse(row.record),17,41)||row.car_code,ticks:row.ticks,driver:publicScoreName(scoreString(JSON.parse(row.record),0,17)),trackName:publicScoreName(row.track_name),createdAt:row.created_at}))});
 }catch(error){console.error('Replay read failed',error);return reply({error:'Shared replays temporarily unavailable'},503);}
}
export async function POST(request:Request){
 const url=new URL(request.url),origin=request.headers.get('origin'),action=request.headers.get('x-stunts-replay'),privateCheck=action==='recheck';
 if((origin&&origin!==url.origin)||request.headers.get('content-type')?.split(';')[0]!=='application/json'||!['share','recheck'].includes(action??''))return reply({error:'Invalid replay request'},403);
 let raw:unknown;try{const body=await request.text();if(body.length>150000)return reply({error:'Replay request too large'},413);raw=JSON.parse(body);}catch{return reply({error:'Invalid replay request'},400);}
 try{
  const {DB:db,ASSETS:assets}=bindings(),now=Math.floor(Date.now()/1000),bucket='replay:'+await scoreHash(new TextEncoder().encode((request.headers.get('cf-connecting-ip')??'local')+':'+Math.floor(now/3600)));
  const limit=await db.prepare('INSERT INTO score_requests(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+7200).first<{count:number}>();if(!limit||limit.count>20)return reply({error:'Sharing limit reached; try later'},429);
  // Re-verify the exact accepted proof; never attach an arbitrary .RPL to a score.
  const verified=await verifyGlobalScore(raw,await globalScoreData(assets,url.origin));
  if(!privateCheck&&verified.replay.length>0x722+12000)return reply({error:'This recording exceeds the original replay viewer’s 10-minute limit; it will not be shortened or published'},422);
  // Acceptance, not its old category rank, authorizes reassessment. The hash
  // binds the exact record and recording; a renamed/arbitrary upload cannot pass.
  const accepted=await db.prepare('SELECT created_at FROM global_scores WHERE id=? AND rules=? UNION ALL SELECT created_at FROM accepted_scores WHERE id=? AND rules=? LIMIT 1').bind(verified.id,GLOBAL_SCORE_RULES,verified.id,GLOBAL_SCORE_RULES).first<{created_at:number}>();
  if(!accepted)return reply({error:'This run has no retained server acceptance record. An arbitrary replay upload cannot create a high score; older displaced scores may no longer be recoverable.'},422);
  const original=(raw as {replay:number[]}).replay,name=scoreString(original,13,22),trackName=/^[A-Za-z0-9_-]{1,8}$/.test(name)?name.toUpperCase():verified.trackHash.slice(0,8).toUpperCase();
  await db.batch([
   db.prepare('INSERT INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET route_assessment=excluded.route_assessment').bind(verified.id,GLOBAL_SCORE_RULES,verified.trackHash,verified.carCode,verified.ticks,JSON.stringify(Array.from(verified.record)),accepted.created_at,driverKey(verified.record,verified.id),verified.routeAssessment),
   db.prepare(retainAcceptedScoresSQL).bind(GLOBAL_SCORE_RULES,verified.trackHash),
   db.prepare('UPDATE run_history SET route_assessment=? WHERE id=?').bind(verified.routeAssessment,verified.id),
   db.prepare(retainRunHistorySQL).bind(GLOBAL_SCORE_RULES,verified.trackHash),
   db.prepare(pruneRunHistorySQL).bind(GLOBAL_SCORE_RULES,verified.trackHash,GLOBAL_SCORE_RULES,verified.trackHash),
   db.prepare(pruneCarScoresSQL).bind(GLOBAL_SCORE_RULES,verified.trackHash,GLOBAL_SCORE_RULES,verified.trackHash),
   ...(!privateCheck?[db.prepare('INSERT OR IGNORE INTO shared_replays(id,replay,track_name,created_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM ('+replayScoresSQL+') WHERE id=?)').bind(verified.id,JSON.stringify(Array.from(verified.replay)),trackName,now,verified.id)]:[]),
   db.prepare(pruneSharedReplaysSQL),
   db.prepare('UPDATE shared_replays SET assessment_version=?,assessed_at=?,assessment_retry_at=0,assessment_reason=? WHERE id=?').bind(ROUTE_ASSESSMENT_VERSION,now,verified.assessmentReason??'',verified.id),
  ]);
  if(privateCheck)return reply({rechecked:true,id:verified.id,routeAssessment:verified.routeAssessment,ranked:!!await db.prepare('SELECT id FROM global_scores WHERE id=?').bind(verified.id).first()});
  if(!await db.prepare('SELECT id FROM shared_replays WHERE id=?').bind(verified.id).first())return reply({error:'Run verified, but it is no longer a ranked score or one of your five most recent verified runs on this track'},422);
  return reply({shared:true,id:verified.id});
 }catch(error){if(error instanceof Error&&/Invalid|eligible|verify|Replay|configuration|supported original/i.test(error.message))return reply({error:error.message},422);console.error('Replay sharing failed',error);return reply({error:'Shared replays temporarily unavailable'},503);}
}
