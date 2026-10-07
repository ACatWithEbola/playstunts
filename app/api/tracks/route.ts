import {env} from 'cloudflare:workers';
import {scoreHash} from '@/lib/game/global-score-format';
import {validateSharedTrack} from '@/lib/server/shared-track-validation';
import {globalScoreData} from '@/lib/server/global-score-data';
const bindings=()=>env as unknown as {DB:D1Database;ASSETS:Fetcher};
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function GET(request:Request){
 const url=new URL(request.url),hash=url.searchParams.get('id'),before=url.searchParams.get('before');
 try{
  const db=bindings().DB;
  if(hash){if(!/^[a-f0-9]{64}$/.test(hash))return reply({error:'Invalid track'},400);const row=await db.prepare('SELECT name,bytes FROM shared_tracks WHERE hash=?').bind(hash).first<{name:string;bytes:string}>();if(!row)return reply({error:'Track not found'},404);return new Response(Uint8Array.from(JSON.parse(row.bytes)),{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="'+row.name+'.TRK"','Cache-Control':'public, max-age=31536000, immutable','X-Content-Type-Options':'nosniff'}});}
  let timestamp=Number.MAX_SAFE_INTEGER,lastHash='';if(before){const parts=before.split(':');if(parts.length!==2||!/^\d{1,16}$/.test(parts[0])||!/^[a-f0-9]{64}$/.test(parts[1]))return reply({error:'Invalid page'},400);timestamp=Number(parts[0]);lastHash=parts[1];}
  const rows=await db.prepare('SELECT hash,name,created_at FROM shared_tracks WHERE created_at < ? OR (created_at = ? AND hash > ?) ORDER BY created_at DESC,hash LIMIT 21').bind(timestamp,timestamp,lastHash).all<{hash:string;name:string;created_at:number}>();
  const tracks=rows.results.slice(0,20),last=tracks.at(-1);return reply({tracks,next:rows.results.length>20&&last?last.created_at+':'+last.hash:null});
 }catch(error){console.error('Shared track read failed',error);return reply({error:'Shared tracks temporarily unavailable'},503);}
}
export async function POST(request:Request){
 if((env as unknown as {LEADERBOARD_RESET_SECRET?:string}).LEADERBOARD_RESET_SECRET)return reply({error:'Leaderboard maintenance in progress; retry shortly'},503);
 const url=new URL(request.url),origin=request.headers.get('origin');
 if((origin&&origin!==url.origin)||request.headers.get('content-type')?.split(';')[0]!=='application/json'||request.headers.get('x-stunts-track')!=='share')return reply({error:'Invalid track request'},403);
 let value:unknown;try{const body=await request.text();if(body.length>9000)return reply({error:'Track too large'},413);value=JSON.parse(body);}catch{return reply({error:'Invalid track'},400);}
 const {DB:db,ASSETS:assets}=bindings(),now=Math.floor(Date.now()/1000);
 try{
  const bucket=await scoreHash(new TextEncoder().encode('track:'+ (request.headers.get('cf-connecting-ip')??'local')+':'+Math.floor(now/86400)));
  const limit=await db.prepare('INSERT INTO score_requests(bucket,count,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count').bind(bucket,now+172800).first<{count:number}>();
  if(!limit||limit.count>10)return reply({error:'Daily sharing limit reached'},429);
  const track=await validateSharedTrack(value,await globalScoreData(assets,url.origin));
  await db.batch([db.prepare('INSERT OR IGNORE INTO shared_tracks(hash,name,bytes,created_at) VALUES (?,?,?,?)').bind(track.hash,track.name,JSON.stringify(Array.from(track.bytes)),now),db.prepare('DELETE FROM score_requests WHERE expires_at < ?').bind(now)]);
  return reply({shared:true,id:track.hash});
 }catch(error){if(error instanceof Error&&/Track|track|\.TRK/.test(error.message))return reply({error:error.message},422);console.error('Shared track submission failed',error);return reply({error:'Shared tracks temporarily unavailable'},503);}
}
