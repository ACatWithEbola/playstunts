import {GLOBAL_SCORE_ENDPOINT,GLOBAL_SCORE_RULES,scoreHash,scoreTicks,sharedScoreFile,validateScoreSubmission,type GlobalScoreSubmission} from './global-score-format.ts';
import type {NativeFilePersistence} from './native-file-store.ts';
import type {RouteAssessment} from '../server/shortcut-assessment.ts';
import {autoShareReplaysEnabled} from './replay-sharing-preference.ts';
export async function createGlobalScoreClient(persistence:NativeFilePersistence,request:typeof fetch=fetch,sharingEnabled=autoShareReplaysEnabled){
 const stored=new Map((await persistence.all()).map(file=>[file.key,file.bytes]));
 const decoder=new TextDecoder(),encoder=new TextEncoder();
 const put=async(key:string,bytes:Uint8Array)=>{await persistence.put({key,bytes});stored.set(key,bytes);};
 const notice=(message:string)=>{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('stunts-global-score-status',{detail:message}));};
 const responseFile=async(response:Response)=>{
  const value=await response.json() as {rules:string;file:number[]};
  if(value.rules!==GLOBAL_SCORE_RULES||!Array.isArray(value.file)||value.file.length!==364||value.file.some(n=>!Number.isInteger(n)||n<0||n>255))throw Error('Invalid shared leaderboard');
  return Uint8Array.from(value.file);
 };
 const share=async(id:string,proof:GlobalScoreSubmission)=>{
  const key='SHARE_PENDING:'+id;if(!sharingEnabled()){await put(key,new Uint8Array());return;}
  try{
   const response=await request('/api/replays',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Replay':'share'},body:JSON.stringify(proof),signal:AbortSignal.timeout(30000)});
   if(response.ok){await put('SHARED:'+id,encoder.encode('true'));await put(key,new Uint8Array());notice('Your qualifying replay was automatically shared publicly.');if(typeof window!=='undefined')window.dispatchEvent(new Event('stunts-public-replay-shared'));return;}
   if([400,403,413,422].includes(response.status)){await put(key,new Uint8Array());notice('Your score is verified, but this replay could not be shared. The recording remains private.');return;}
  }catch{/* Retry only while the player keeps automatic sharing enabled. */}
  notice('Your score is verified. Automatic replay sharing will retry while enabled.');
 };
 const send=async(key:string,submission:GlobalScoreSubmission,hash:string)=>{
  try{
   const response=await request(GLOBAL_SCORE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES},body:JSON.stringify(submission),signal:AbortSignal.timeout(30000)});
 if(response.ok){const copy=response.clone(),result=await copy.json() as {id?:string;ranked?:boolean};await put('BOARD:'+hash,await responseFile(response));if(result.id&&/^[a-f0-9]{64}$/.test(result.id)){await put('VERIFIED:'+result.id,encoder.encode(JSON.stringify(submission)));if(typeof window!=='undefined')window.dispatchEvent(new Event('stunts-verified-replays'));}await put(key,new Uint8Array());notice(result.ranked===false?'Run verified, but it did not improve your category/car ranking. Its recording was kept privately in this browser.':'High score verified and shared. You can optionally share its replay below.');if(result.ranked===true&&result.id&&/^[a-f0-9]{64}$/.test(result.id)&&sharingEnabled()&&!stored.get('SHARED:'+result.id)?.length){await put('SHARE_PENDING:'+result.id,encoder.encode(JSON.stringify(submission)));await share(result.id,submission);}return 'accepted';}
   if([400,403,413,422].includes(response.status)){await put('REJECTED:'+key.slice(8),stored.get(key)??encoder.encode(JSON.stringify({submission,hash})));await put(key,new Uint8Array());notice('This run could not be verified for the global leaderboard. A copy was kept in this browser.');return 'rejected';}
  }catch{/* Keep offline results queued across reloads. */}
  notice('Your high score is waiting to be uploaded. It will retry when this browser is online.');return 'pending';
 };
 let flushing:Promise<void>|undefined;
 const flush=()=>flushing??=(async()=>{for(const [key,bytes] of [...stored]){if(!key.startsWith('PENDING:')||!bytes.length)continue;try{const pending=JSON.parse(decoder.decode(bytes)) as {submission:GlobalScoreSubmission;hash:string};await send(key,pending.submission,pending.hash);}catch{await put(key,new Uint8Array());}}for(const [key,bytes] of [...stored]){if(!key.startsWith('SHARE_PENDING:')||!bytes.length)continue;try{await share(key.slice(14),JSON.parse(decoder.decode(bytes)) as GlobalScoreSubmission);}catch{await put(key,new Uint8Array());}}})().finally(()=>{flushing=undefined;});
 return {
  flush,
  close(){persistence.close?.();},
  async assess(submission:GlobalScoreSubmission):Promise<RouteAssessment|undefined>{
   try{const response=await request(GLOBAL_SCORE_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Score':GLOBAL_SCORE_RULES},body:JSON.stringify({...submission,validateOnly:true}),signal:AbortSignal.timeout(30000)});
    if(!response.ok)return undefined;const body=await response.json() as {verified?:boolean;routeAssessment?:string};
    if(body.verified&&['full_route','shortcuts_detected','not_assessed'].includes(body.routeAssessment??''))return body.routeAssessment as RouteAssessment;
   }catch{/* Offline qualification may queue a score; it never invents a category. */}
   return undefined;
  },
  async read(track:Uint8Array,car?:string,category?:RouteAssessment){
   const hash=await scoreHash(track);await flush();
   const boardKey='BOARD:'+hash+(car?':'+car:'')+(category?':'+category:'');
   try{const response=await request(GLOBAL_SCORE_ENDPOINT+'?track='+hash+(car?'&car='+car:'')+(category?'&category='+category:''),{cache:'no-store',signal:AbortSignal.timeout(5000)});if(response.ok)await put(boardKey,await responseFile(response));}catch{/* Use the last shared table while offline. */}
   const cached=stored.get(boardKey)??sharedScoreFile([]);
   const records=Array.from({length:7},(_,i)=>Array.from(cached.slice(i*52,i*52+52))).filter(row=>scoreTicks(row)!==65535);
   for(const [key,bytes] of stored){if(category||!key.startsWith('PENDING:')||!bytes.length)continue;const pending=JSON.parse(decoder.decode(bytes)) as {submission:GlobalScoreSubmission;hash:string};if(pending.hash===hash&&(!car||String.fromCharCode(...pending.submission.replay.slice(0,4))===car))records.push(pending.submission.record);}
   records.sort((a,b)=>scoreTicks(a)-scoreTicks(b));
   const seen=new Set<string>();return sharedScoreFile(records.filter(record=>{const name=String.fromCharCode(...record.slice(0,17)).split('\0')[0].trim().replace(/[A-Z]/g,c=>c.toLowerCase());if(!name)return true;if(seen.has(name))return false;seen.add(name);return true;}));
  },
  async submit(submission:GlobalScoreSubmission){
   validateScoreSubmission(submission);const hash=await scoreHash(Uint8Array.from(submission.replay.slice(24,0x722)));
   const key='PENDING:'+await scoreHash(Uint8Array.from([...submission.replay,...submission.record]));
   await put(key,encoder.encode(JSON.stringify({submission,hash})));return send(key,submission,hash);
  },
 };
}
