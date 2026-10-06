import {env} from 'cloudflare:workers';
import {GLOBAL_SCORE_RULES,scoreHash,scoreString,validateScoreSubmission,sharedScoreFile} from '@/lib/game/global-score-format';
import {publicScoreName} from '@/lib/game/public-score-name';
import {verifyGlobalScore} from '@/lib/server/verify-global-score';
import {globalScoreData} from '@/lib/server/global-score-data';

const bindings=()=>env as unknown as {DB:D1Database;ASSETS:Fetcher};
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function board(db:D1Database,hash:string){
 const result=await db.prepare('SELECT record FROM global_scores WHERE rules = ? AND track_hash = ? ORDER BY ticks, created_at, id LIMIT 7').bind(GLOBAL_SCORE_RULES,hash).all<{record:string}>();
 return Array.from(sharedScoreFile(result.results.map(row=>{const record=JSON.parse(row.record) as number[],name=publicScoreName(scoreString(record,0,17));if(name==='••••'){record.fill(0,0,17);record.fill(42,0,4);}return record;})));
}
export async function GET(request:Request){
 const hash=new URL(request.url).searchParams.get('track');if(!hash||!/^[a-f0-9]{64}$/.test(hash))return reply({error:'Invalid track'},400);
 try{return reply({rules:GLOBAL_SCORE_RULES,file:await board(bindings().DB,hash)});}catch(error){console.error('Shared score read failed',error);return reply({error:'Shared scores temporarily unavailable'},503);}
}
export async function POST(request:Request){
 const url=new URL(request.url),origin=request.headers.get('origin');
 if((origin&&origin!==url.origin)||request.headers.get('content-type')?.split(';')[0]!=='application/json'||request.headers.get('x-stunts-score')!==GLOBAL_SCORE_RULES)return reply({error:'Invalid score request'},403);
 let raw:unknown;
 try{const body=await request.text();if(body.length>150000)return reply({error:'Score request too large'},413);raw=JSON.parse(body);validateScoreSubmission(raw);}catch(error){return reply({error:error instanceof Error?error.message:'Invalid score'},400);}
 const {DB:db,ASSETS:assets}=bindings(),now=Math.floor(Date.now()/1000);
 try{
  const bucket=await scoreHash(new TextEncoder().encode((request.headers.get('cf-connecting-ip')??'local')+':'+Math.floor(now/3600)));
  const limit=await db.prepare('INSERT INTO score_requests(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+7200).first<{count:number}>();
  if(!limit||limit.count>20)return reply({error:'Submission limit reached; try later'},429);
  const verified=await verifyGlobalScore(raw,await globalScoreData(assets,url.origin));
  if((raw as {validateOnly?:unknown}).validateOnly===true)return reply({verified:true,ticks:verified.ticks,track:verified.trackHash,car:verified.carCode});
  const name=scoreString((raw as {replay:number[]}).replay,13,22),trackName=/^[A-Za-z0-9_-]{1,8}$/.test(name)?name.toUpperCase():'Track '+verified.trackHash.slice(0,8).toUpperCase();
  await db.batch([
   db.prepare('INSERT OR IGNORE INTO score_tracks(hash,name) VALUES (?,?)').bind(verified.trackHash,trackName),
   db.prepare('INSERT OR IGNORE INTO global_scores(id,rules,track_hash,car_code,ticks,record,created_at) VALUES (?,?,?,?,?,?,?)').bind(verified.id,GLOBAL_SCORE_RULES,verified.trackHash,verified.carCode,verified.ticks,JSON.stringify(Array.from(verified.record)),now),
   db.prepare('DELETE FROM global_scores WHERE rules=? AND track_hash=? AND id NOT IN (SELECT id FROM global_scores WHERE rules=? AND track_hash=? ORDER BY ticks,created_at,id LIMIT 7)').bind(GLOBAL_SCORE_RULES,verified.trackHash,GLOBAL_SCORE_RULES,verified.trackHash),
   db.prepare('DELETE FROM score_requests WHERE expires_at < ?').bind(now),
   db.prepare('DELETE FROM shared_replays WHERE id NOT IN (SELECT id FROM global_scores)'),
  ]);
  const ranked=!!await db.prepare('SELECT id FROM global_scores WHERE id=?').bind(verified.id).first();
  return reply({accepted:true,id:verified.id,ranked,rules:GLOBAL_SCORE_RULES,file:await board(db,verified.trackHash)});
 }catch(error){
  if(error instanceof Error&&/Invalid|eligible|verify|Replay|configuration|supported original/i.test(error.message))return reply({error:error.message},422);
  console.error('Shared score submission failed',error);
  return reply({error:'Shared scores temporarily unavailable'},503);
 }
}
