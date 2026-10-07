import {env} from 'cloudflare:workers';
import {GLOBAL_SCORE_RULES,scoreString} from '@/lib/game/global-score-format';
import {driverKey,resolvedDriverSQL,currentCarScoresSQL} from '@/lib/server/leaderboard-ranking';
import {publicScoreName} from '@/lib/game/public-score-name';
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('score');if(!id||!/^[a-f0-9]{64}$/.test(id))return reply({error:'Invalid score'},400);
 try{
  const {DB:db}=env as unknown as {DB:D1Database};
  const anchor=await db.prepare('SELECT id,track_hash,driver_key,record FROM global_scores WHERE id=? AND rules=? UNION ALL SELECT id,track_hash,driver_key,record FROM run_history WHERE id=? AND rules=? LIMIT 1').bind(id,GLOBAL_SCORE_RULES,id,GLOBAL_SCORE_RULES).first<{id:string;track_hash:string;driver_key:string;record:string}>();
  if(!anchor)return reply({error:'Run history is no longer available'},404);
  const key=anchor.driver_key||driverKey(JSON.parse(anchor.record),id),args=[GLOBAL_SCORE_RULES,anchor.track_hash,key];
  const available=`SELECT id,rules,track_hash,car_code,ticks,record,created_at,driver_key,route_assessment,rowid AS sequence FROM run_history WHERE rules=? AND track_hash=? AND driver_key=? UNION ALL SELECT s.id,s.rules,s.track_hash,s.car_code,s.ticks,s.record,s.created_at,${resolvedDriverSQL},s.route_assessment,s.rowid AS sequence FROM global_scores s WHERE s.rules=? AND s.track_hash=? AND ${resolvedDriverSQL}=? AND s.id NOT IN (SELECT id FROM run_history WHERE rules=? AND track_hash=? AND driver_key=?)`;
  const rows=await db.prepare('WITH available AS ('+available+') SELECT a.*,EXISTS(SELECT 1 FROM ('+currentCarScoresSQL+') s WHERE s.id=a.id) AS ranked,EXISTS(SELECT 1 FROM shared_replays r WHERE r.id=a.id) AS has_replay FROM available a ORDER BY created_at DESC,sequence DESC,id LIMIT 5').bind(...args,...args,...args).all<{id:string;car_code:string;ticks:number;record:string;created_at:number;route_assessment:string;ranked:number;has_replay:number}>();
  return reply({anonymous:key.startsWith('anonymous:'),runs:rows.results.map(r=>({id:r.id,car:publicScoreName(scoreString(JSON.parse(r.record),17,41))||r.car_code,carCode:r.car_code,ticks:r.ticks,postedAt:r.created_at,routeAssessment:['full_route','shortcuts_detected'].includes(r.route_assessment)?r.route_assessment:'not_assessed',ranked:!!r.ranked,replay:!!r.has_replay})),partial:true});
 }catch(error){console.error('Run history unavailable',error);return reply({error:'Recent runs are temporarily unavailable'},503);}
}
