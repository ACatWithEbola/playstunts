import {env} from 'cloudflare:workers';
import {GLOBAL_SCORE_RULES} from '@/lib/game/global-score-format';
import {createTrackLabelCatalog} from '@/lib/server/track-label-catalog';
import {publicLeaderboards,type PublicScoreRow} from '@/lib/server/public-leaderboards';
import {combinedCarScoresSQL} from '@/lib/server/leaderboard-ranking';
import {engineScopedRanking,engineScorePredicate} from '@/lib/server/engine-scoped-ranking';
import {resolvePhysicsEngine} from '@/lib/physics/engine-version';
import {withdrawnCommunityTracks} from '@/lib/server/withdrawn-community-tracks';
import {leaderboardSearch} from '@/lib/server/leaderboard-search';
const bindings=()=>env as unknown as {DB:D1Database;ASSETS:Fetcher};
let names:ReturnType<typeof createTrackLabelCatalog>|undefined;
import {ORIGINAL_STARTER_TRACKS} from '@/lib/game/original-starter-tracks';
function bundledNames(assets:Fetcher,origin:string){names??=createTrackLabelCatalog(async()=>{const response=await assets.fetch(new Request(new URL('/game/assets.json',origin)));if(!response.ok)throw Error('Track catalog unavailable');const data=await response.json() as {tracks:{name:string;raw:number[]}[]};return {tracks:[...data.tracks,...ORIGINAL_STARTER_TRACKS]};},error=>console.warn('Optional track labels unavailable; using stored labels and content IDs',error));return names();}
export async function GET(request:Request){
 try{const {DB,ASSETS}=bindings(),url=new URL(request.url),page=Number(url.searchParams.get('page')??0),query=(url.searchParams.get('q')??'').trim(),sort=url.searchParams.get('sort')??'recent';
  if(!Number.isInteger(page)||page<0||page>100000||query.length>80||!['name','recent'].includes(sort))return Response.json({error:'Invalid leaderboard search'},{status:400});
  // The directory combines editions. Keep explicit API filters compatible,
  // but never infer a score's edition from the fresh-game default or UI state.
  let engine;try{engine=url.searchParams.has('engine')?resolvePhysicsEngine(url.searchParams.get('engine')):undefined;}catch{return Response.json({error:'Invalid leaderboard search'},{status:400});}
  const engineFilter=engine?engineScorePredicate(engine):'1=1';
  const bundled=await bundledNames(ASSETS,url.origin),catalog=JSON.stringify(Object.fromEntries(bundled));
  const label="COALESCE(json_extract(?,'$.\"'||s.track_hash||'\"'),t.name,m.name,'Track '||upper(substr(s.track_hash,1,8)))";
  const text=(from:number,to:number)=>'char('+Array.from({length:to-from},(_,i)=>`json_extract(s.record,'$[${from+i}]')`).join(',')+')';
  const search=leaderboardSearch(query,label,text,catalog),where=`s.rules=? AND s.track_hash NOT IN (${withdrawnCommunityTracks.map(()=>'?').join(',')}) AND ${search.sql}`;
  const from=' FROM global_scores s LEFT JOIN shared_tracks t ON t.hash=s.track_hash LEFT JOIN score_tracks m ON m.hash=s.track_hash WHERE '+engineFilter+' AND '+where;
  const params=[GLOBAL_SCORE_RULES,...withdrawnCommunityTracks,...search.params];
  const total=await DB.prepare('SELECT COUNT(DISTINCT s.track_hash) AS tracks'+from).bind(...params).first<{tracks:number}>();
  const tracks=await DB.prepare('SELECT s.track_hash,MAX(s.created_at) AS updated_at,'+label+' AS name'+from+' GROUP BY s.track_hash ORDER BY '+(sort==='name'?'name COLLATE NOCASE,s.track_hash':'updated_at DESC,s.track_hash')+' LIMIT 13 OFFSET ?').bind(catalog,...params,page*12).all<{track_hash:string;name:string;updated_at:number}>();
  const selected=tracks.results.slice(0,12),hashes=selected.map(track=>track.track_hash);
  const rows=hashes.length?await DB.prepare("SELECT s.id,s.track_hash,s.car_code,s.ticks,s.record,s.created_at,s.route_assessment,COALESCE((SELECT physics_engine FROM race_engines e WHERE e.id=s.id),'ms-1990') AS physics_engine,(SELECT assessment_reason FROM shared_replays r WHERE r.id=s.id) AS assessment_reason,COALESCE(t.name,m.name) AS track_name,EXISTS(SELECT 1 FROM shared_replays r WHERE r.id=s.id) AS has_replay FROM global_scores s LEFT JOIN shared_tracks t ON t.hash=s.track_hash LEFT JOIN score_tracks m ON m.hash=s.track_hash WHERE "+engineFilter+' AND s.rules=? AND s.track_hash IN ('+hashes.map(()=>'?').join(',')+') ORDER BY s.track_hash,s.ticks,s.created_at,s.id').bind(GLOBAL_SCORE_RULES,...hashes).all<PublicScoreRow>():{results:[]};
  const mapped=new Map(publicLeaderboards(rows.results,bundled,engine).map(board=>[board.hash,board])),boards=selected.map(track=>mapped.get(track.track_hash)).filter(Boolean);
  const summary=await DB.prepare('SELECT COUNT(DISTINCT track_hash) AS tracks,COUNT(*) AS scores,SUM(EXISTS(SELECT 1 FROM shared_replays r WHERE r.id=s.id)) AS replays FROM ('+(engine?engineScopedRanking(combinedCarScoresSQL,engine):combinedCarScoresSQL)+') s WHERE rules=? AND track_hash NOT IN ('+withdrawnCommunityTracks.map(()=>'?').join(',')+')').bind(GLOBAL_SCORE_RULES,...withdrawnCommunityTracks).first<{tracks:number;scores:number;replays:number}>();
  return Response.json({boards,checkedAt:Date.now(),totalTracks:total?.tracks??0,hasMore:tracks.results.length>12,page,summary},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){console.error('Leaderboard directory unavailable',error);return Response.json({error:'High scores are temporarily unavailable. Please try again.'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
