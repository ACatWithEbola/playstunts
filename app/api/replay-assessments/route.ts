import {boundedRequestText} from '@/lib/server/bounded-request-body';
import {env} from 'cloudflare:workers';
import {globalScoreData} from '@/lib/server/global-score-data';
import {reassessNextPublicReplay} from '@/lib/server/reassess-public-replays';
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(request:Request){
 const url=new URL(request.url),origin=request.headers.get('origin');
 if(origin&&origin!==url.origin||request.headers.get('x-stunts-assessment')!=='refresh'||request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'Invalid assessment request'},403);
 try{
  // This endpoint accepts no replay, score ID or client classification.
  if(await boundedRequestText(request,2)!=='{}')return reply({error:'Assessment requests do not accept uploads'},400);
  const {DB,ASSETS}=env as unknown as {DB:D1Database;ASSETS:Fetcher};
  return reply(await reassessNextPublicReplay(DB,()=>globalScoreData(ASSETS,url.origin)));
 }catch(error){console.error('Public replay assessment temporarily unavailable',error);return reply({error:'Replay checks will retry on a later refresh'},503);}
}
