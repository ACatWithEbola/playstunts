import {env} from 'cloudflare:workers';
import {RESET_ARCHIVE_ID,RESET_SNAPSHOT_SQL,backupLeaderboard,purgeLeaderboard} from '@/lib/server/leaderboard-reset';
import {scoreHash} from '@/lib/game/global-score-format';
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const bindings=()=>env as unknown as {DB:D1Database;LEADERBOARD_RESET_SECRET?:string};
function authorized(request:Request){const secret=bindings().LEADERBOARD_RESET_SECRET;return !!secret&&secret.length>=32&&request.headers.get('authorization')==='Bearer '+secret;}
export async function GET(request:Request){
 if(!authorized(request))return reply({error:'Not found'},404);
 const db=bindings().DB;
 const archive=await db.prepare('SELECT payload,created_at,purged_at FROM leaderboard_reset_backups WHERE id=?').bind(RESET_ARCHIVE_ID).first<{payload:string;created_at:number;purged_at:number}>();
 if(!archive)return reply({error:'Backup not created'},404);
 const current=await db.prepare(RESET_SNAPSHOT_SQL).first<{payload:string}>();
 return reply({id:RESET_ARCHIVE_ID,...archive,current:JSON.parse(current!.payload),sha256:await scoreHash(new TextEncoder().encode(archive.payload))});
}
export async function POST(request:Request){
 if(!authorized(request))return reply({error:'Not found'},404);
 try{
  const text=await request.text();if(text.length>1024)return reply({error:'Invalid request'},400);
  const body=JSON.parse(text) as {action:string;sha256?:string};const db=bindings().DB,now=Math.floor(Date.now()/1000);
  if(body.action==='backup'){const archive=await backupLeaderboard(db,now);return reply({backedUp:true,id:RESET_ARCHIVE_ID,sha256:await scoreHash(new TextEncoder().encode(archive!.payload))});}
  if(body.action==='purge'){
   const archive=await db.prepare('SELECT payload FROM leaderboard_reset_backups WHERE id=?').bind(RESET_ARCHIVE_ID).first<{payload:string}>();
   if(!archive||body.sha256!==await scoreHash(new TextEncoder().encode(archive.payload)))return reply({error:'Verified backup digest required'},409);
   return reply(await purgeLeaderboard(db,now,crypto.randomUUID()));
  }
  return reply({error:'Invalid action'},400);
 }catch(error){return reply({error:error instanceof Error?error.message:'Maintenance failed'},409);}
}
