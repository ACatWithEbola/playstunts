'use client';
import {WebsiteText,WebsiteElement,useWebsiteLocale} from '@/app/WebsiteLanguage';
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {History,X} from 'lucide-react';
import type {LeaderboardScore} from '@/lib/server/public-leaderboards';
import type {RouteAssessment} from '@/lib/server/shortcut-assessment';
import RouteBadge from './RouteBadge';
type Run={id:string;car:string;carCode:string;ticks:number;postedAt:number;routeAssessment:RouteAssessment;assessmentReason?:string;ranked:boolean;replay:boolean};
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${(Math.floor(ticks/20)%60).toString().padStart(2,'0')}.${((ticks%20)*5).toString().padStart(2,'0')}`;
export default function DriverHistory({score,track}:{score:LeaderboardScore;track:string}){
 const locale=useWebsiteLocale();
 const id=useId(),button=useRef<HTMLButtonElement>(null),panel=useRef<HTMLElement>(null),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),suppressFocus=useRef(false);
 const [open,setOpen]=useState(false),[position,setPosition]=useState({top:0,left:0}),[runs,setRuns]=useState<Run[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[anonymous,setAnonymous]=useState(false);
 const cancelClose=()=>{clearTimeout(timer.current);};
 const close=()=>{cancelClose();setOpen(false);};
 const show=()=>{cancelClose();const rect=button.current?.getBoundingClientRect();if(!rect)return;const width=Math.min(420,window.innerWidth-24),height=Math.min(520,window.innerHeight-24);setPosition({left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12)),top:rect.bottom+height+12<=window.innerHeight?rect.bottom+8:Math.max(12,rect.top-height-8)});setOpen(true);};
 const delayClose=()=>{cancelClose();timer.current=setTimeout(close,180);};
 useEffect(()=>{
  if(!open)return;const abort=new AbortController();setBusy(true);setError('');
  void (async()=>{try{const response=await fetch('/api/run-history?score='+score.id,{cache:'no-store',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(10000)])}),body=await response.json() as {runs:Run[];anonymous:boolean;error?:string};if(!response.ok)throw Error(body.error);if(!abort.signal.aborted){setRuns(body.runs);setAnonymous(body.anonymous);}}catch(e){if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Recent runs are unavailable.');}finally{if(!abort.signal.aborted)setBusy(false);}})();
  const dismiss=(event:Event)=>{if(event.type==='keydown'&&(event as KeyboardEvent).key!=='Escape')return;if(event.type==='pointerdown'&&(button.current?.contains(event.target as Node)||panel.current?.contains(event.target as Node)))return;setOpen(false);if(event.type==='keydown'&&document.activeElement!==button.current){suppressFocus.current=true;button.current?.focus();}};
  document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',dismiss);window.addEventListener('resize',dismiss);
  return()=>{abort.abort();clearTimeout(timer.current);document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',dismiss);window.removeEventListener('resize',dismiss);};
 },[open,score.id]);
 return <><WebsiteElement as="button" ref={button} type="button" className="scores-driver-trigger" aria-label={`Recent runs for ${score.driver} on ${track}`} aria-expanded={open} aria-controls={open?id:undefined} onMouseEnter={show} onMouseLeave={delayClose} onFocus={()=>{if(suppressFocus.current){suppressFocus.current=false;return;}show();}} onBlur={event=>{if(!panel.current?.contains(event.relatedTarget as Node))delayClose();}} onClick={show}><strong className="scores-driver">{score.driver}</strong><History size={13} aria-hidden="true"/></WebsiteElement>
 {open&&createPortal(<WebsiteElement as="aside" id={id} ref={panel} className="scores-history-panel" style={{...position,maxHeight:`calc(100dvh - ${position.top+12}px)`}} aria-label={`Recent runs for ${score.driver} on ${track}`} onMouseEnter={cancelClose} onMouseLeave={delayClose} onFocus={cancelClose} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node)&&event.relatedTarget!==button.current)delayClose();}}><header><div><span><WebsiteText text={"RECENT RUNS · "}/>{track}</span><h4>{score.driver}</h4><p>{anonymous?<WebsiteText text={'This anonymous run only'}/>:<WebsiteText text={'Five most recent verified runs · All cars'}/>}</p></div><WebsiteElement as="button" type="button" aria-label="Close recent runs" onClick={()=>{suppressFocus.current=true;close();button.current?.focus();}}><X size={18} aria-hidden="true"/></WebsiteElement></header>
 {busy?<p className="scores-history-message" role="status"><WebsiteText text={"Loading verified runs…"}/></p>:error?<p className="scores-history-message" role="status">{<WebsiteText text={error}/>}</p>:<ol>{runs.map(run=><li key={run.id}><div className="scores-history-time"><strong>{time(run.ticks)}</strong><span className={run.ranked?'scores-history-ranked':''}>{run.ranked?<WebsiteText text={'On car leaderboard'}/>:<WebsiteText text={'Not on car leaderboard'}/>}</span></div><div className="scores-history-meta"><span>{run.car}</span><time dateTime={new Date(run.postedAt*1000).toISOString()}>{new Date(run.postedAt*1000).toLocaleString(locale,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:false})}</time></div><div className="scores-history-evidence"><RouteBadge assessment={run.routeAssessment} reason={run.assessmentReason}/>{run.replay&&<a href={'/api/replays?id='+run.id} download><WebsiteText text={"Replay ↗"}/></a>}</div></li>)}</ol>}
 <footer><WebsiteText text={"Up to five server-verified submissions. Older discarded attempts are unavailable. Names are not verified accounts."}/></footer></WebsiteElement>,document.body)}</>;
}
