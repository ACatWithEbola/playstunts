import {env} from 'cloudflare:workers';
import {boundedRequestText} from '@/lib/server/bounded-request-body';
import {publicSubmissionRows,publicSubmission,processScoreSubmission,type SubmissionRow} from '@/lib/server/score-submissions';
import {POST as acceptScore} from '../highscores/route';
import {GLOBAL_SCORE_RULES} from '@/lib/game/global-score-format';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function GET(request:Request){
 try{const {DB}=env as unknown as {DB:D1Database},id=new URL(request.url).searchParams.get('id');
  if(id!==null){if(!/^[a-f0-9]{64}$/.test(id))return reply({error:'Invalid submission ID'},400);const row=await DB.prepare('SELECT * FROM score_submissions WHERE id=?').bind(id).first<SubmissionRow>();return row?reply(publicSubmission(row)):reply({error:'Submission not found'},404);}
  return reply({submissions:(await publicSubmissionRows(DB)).map(publicSubmission)});
 }catch(error){console.error('Submission status unavailable',error);return reply({error:'Verification status is temporarily unavailable.'},503);}
}
export async function POST(request:Request){
 const url=new URL(request.url),origin=request.headers.get('origin');
 if((origin&&origin!==url.origin)||request.headers.get('content-type')?.split(';')[0]!=='application/json'||request.headers.get('x-stunts-verification')!=='check')return reply({error:'Invalid verification request'},403);
 let target:string|undefined;
 try{const value=JSON.parse(await boundedRequestText(request,100));if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>k!=='id')||(value.id!==undefined&&(typeof value.id!=='string'||!/^[a-f0-9]{64}$/.test(value.id))))return reply({error:'Invalid verification request'},400);target=value.id;}catch{return reply({error:'Invalid verification request'},400);}
 try{const {DB}=env as unknown as {DB:D1Database};const result=await processScoreSubmission(DB,raw=>acceptScore(new Request(new URL('/api/highscores',url),{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES,'Origin':url.origin,'CF-Connecting-IP':request.headers.get('cf-connecting-ip')??'local'},body:JSON.stringify(raw)})),target);return reply(result);}
 catch(error){console.error('Queued verification unavailable',error);return reply({error:'Verification status is temporarily unavailable.'},503);}
}
