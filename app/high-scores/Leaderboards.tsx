'use client';
import {WebsiteText,WebsiteElement,useWebsiteLocale} from '@/app/WebsiteLanguage';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {Leaderboard} from '@/lib/server/public-leaderboards';
import TrackLeaderboard from './TrackLeaderboard';
export default function Leaderboards(){
 const locale=useWebsiteLocale();
 const [boards,setBoards]=useState<Leaderboard[]>([]),[query,setQuery]=useState(''),[sort,setSort]=useState('recent'),[checked,setChecked]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(true),[local,setLocal]=useState(false),[page,setPage]=useState(0),[hasMore,setHasMore]=useState(false),[total,setTotal]=useState(0),[summary,setSummary]=useState({tracks:0,scores:0,replays:0});
 const requestId=useRef(0),controller=useRef<AbortController|null>(null);
 const [assessmentMessage,setAssessmentMessage]=useState('');
 const refresh=useCallback(async(nextPage=0)=>{
  controller.current?.abort();const abort=new AbortController();controller.current=abort;const id=++requestId.current;setBusy(true);setAssessmentMessage('');
  const read=async()=>{
   const response=await fetch('/api/leaderboards?'+new URLSearchParams({q:query,sort,page:String(nextPage)}),{cache:'no-store',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(15000)])});
   const body=await response.json() as {boards:Leaderboard[];checkedAt:number;error?:string;hasMore:boolean;totalTracks:number;summary:{tracks:number;scores:number;replays:number}};
   if(!response.ok)throw Error(body.error);
   if(id===requestId.current){setBoards(before=>nextPage?[...new Map([...before,...body.boards].map(board=>[board.hash,board])).values()]:body.boards);setPage(nextPage);setHasMore(body.hasMore);setTotal(body.totalTracks);setSummary({...body.summary,replays:body.summary.replays??0});setChecked(body.checkedAt);setError('');}
  };
  try{await read();}catch(error){if(id===requestId.current&&!abort.signal.aborted)setError(error instanceof Error?error.message:'Could not refresh scores. Try again.');return;}finally{if(id===requestId.current)setBusy(false);}
  if(nextPage||id!==requestId.current||abort.signal.aborted)return;
  // Existing scores are already visible. Progress is bounded; public backlog
  // is shared across visitors and continues on later hourly/manual refreshes.
  setAssessmentMessage('Checking saved replay routes…');
  try{
   for(let attempt=0;attempt<6;attempt++){
    const response=await fetch('/api/replay-assessments',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Assessment':'refresh'},body:'{}',cache:'no-store',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(30000)])});
    if(!response.ok)throw Error('Replay checks will retry on a later refresh.');
    const result=await response.json() as {state:string;pending:number;changed:boolean};
    if(id!==requestId.current||abort.signal.aborted)return;
    if(result.changed||result.state==='busy'||!result.pending)await read();
    if(!result.pending){setAssessmentMessage('Saved replay routes are up to date.');return;}
    if(result.state==='idle'){setAssessmentMessage('Some replay checks will retry later.');return;}
    if(result.state==='busy')await new Promise(resolve=>setTimeout(resolve,1500));
   }
   if(id===requestId.current)setAssessmentMessage('More saved replays will be checked on the next refresh.');
  }catch{if(id===requestId.current&&!abort.signal.aborted)setAssessmentMessage('Replay checks will retry on a later refresh.');}
 },[query,sort]);
 useEffect(()=>{setLocal(['localhost','127.0.0.1'].includes(location.hostname));const initial=setTimeout(()=>void refresh(),250),interval=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},3600000),focus=()=>{if(document.visibilityState==='visible')void refresh();};window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);return()=>{clearTimeout(initial);clearInterval(interval);controller.current?.abort();requestId.current++;window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};},[refresh]);
 const filtered=boards;
 return <>
  <section className="scores-hero" aria-labelledby="scores-heading"><div><span className="scores-eyebrow"><i aria-hidden="true"/><WebsiteText text={" GLOBAL HIGH SCORES"}/></span><h2 id="scores-heading"><WebsiteText text={"HIGH SCORES."}/><br/><WebsiteText text={"WORLDWIDE."}/></h2><p><WebsiteText text={"One driver. One place. Your best run deserves the spotlight."}/></p></div><div className="scores-summary"><div><strong>{summary.tracks.toLocaleString()}</strong><span><WebsiteText text={"TRACKS RANKED"}/></span></div><div><strong>{summary.scores.toLocaleString()}</strong><span><WebsiteText text={"BEST CAR TIMES"}/></span></div><div><strong>{summary.replays.toLocaleString()}</strong><span><WebsiteText text={"WATCHABLE REPLAYS"}/></span></div><p><WebsiteText text={"Overall and individual car rankings."}/><br/><WebsiteText text={"Different track contents, separate boards."}/></p></div></section>
  {local&&<aside className="scores-local"><WebsiteText text={"LOCAL PREVIEW · These are isolated local test scores, not the live leaderboard."}/></aside>}
  <WebsiteElement as="section" className="scores-directory" aria-label="Track leaderboards"><div className="scores-tools"><div className="scores-search"><label htmlFor="score-search"><WebsiteText text={"FIND A TRACK, DRIVER OR CAR"}/></label><WebsiteElement as="input" id="score-search" type="search" value={query} onChange={event=>{setQuery(event.target.value);}} placeholder="Search the leaderboards…"/></div><div className="scores-sort"><label htmlFor="score-sort"><WebsiteText text={"SORT TRACKS"}/></label><select id="score-sort" value={sort} onChange={event=>{setSort(event.target.value);}}><option value="recent"><WebsiteText text={"Recently updated"}/></option><option value="name"><WebsiteText text={"Track name A–Z"}/></option></select><svg className="scores-sort-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div><button className="scores-refresh" disabled={busy} onClick={()=>void refresh()}>{busy?<WebsiteText text={'Refreshing…'}/>:<WebsiteText text={'Refresh scores'}/>} <span aria-hidden="true">↻</span></button></div>
  <div className="scores-update" role="status" aria-live="polite"><span>{checked?<WebsiteText text={`Checked ${new Date(checked).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit',hour12:false})}`}/>:busy?<WebsiteText text={'Loading shared times…'}/>:<WebsiteText text={'Not checked yet'}/>}<WebsiteText text={" · Refreshes hourly and when you return"}/></span><span>{total} {total===1?<WebsiteText text={'track'}/>:<WebsiteText text={'tracks'}/>}{query?<WebsiteText text={' found'}/>:<WebsiteText text={''}/>}</span></div>
  {assessmentMessage&&<p className="scores-fair" role="status" aria-live="polite">{<WebsiteText text={assessmentMessage}/>}</p>}
  {error&&<p className="scores-error" role="alert">{<WebsiteText text={error}/>}{checked?<WebsiteText text={' Previously loaded times are still shown.'}/>:<WebsiteText text={''}/>}</p>}
  {!busy&&!error&&!filtered.length&&<div className="scores-empty"><span aria-hidden="true">—</span><h3>{query?<WebsiteText text={'No matching tracks'}/>:<WebsiteText text={'The grid is waiting.'}/>}</h3><p>{query?<WebsiteText text={'Try another track, driver or car name.'}/>:<WebsiteText text={'Finish a qualifying race and your track’s leaderboard will appear here.'}/>}</p>{query?<button onClick={()=>setQuery('')}><WebsiteText text={"Clear search"}/></button>:<a href="/#play"><WebsiteText text={"Let’s drive →"}/></a>}</div>}
  <div className="scores-boards">{filtered.map(board=><TrackLeaderboard key={board.hash} board={board}/>)}</div>
  {hasMore&&<button disabled={busy} className="scores-more" onClick={()=>void refresh(page+1)}><WebsiteText text={"Load more tracks ("}/>{Math.max(0,total-boards.length)}<WebsiteText text={" remaining)"}/></button>}
  <p className="scores-fair"><WebsiteText text={"One place per named driver in each ranking. Names are grouped ignoring letter case and surrounding spaces, not verified accounts; unnamed runs remain separate. Fresh, completed races only. Replay continuation is not eligible. Common profanity is masked. "}/><a href="/faq#global-scores"><WebsiteText text={"Read the scoring rules ↗"}/></a></p>
  </WebsiteElement>
 </>;
}
