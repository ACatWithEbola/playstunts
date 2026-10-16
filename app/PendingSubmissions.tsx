'use client';
import {WebsiteText} from './WebsiteLanguage';
import {usePublicSubmissions} from './usePublicSubmissions';
import TrackIdentity from './TrackIdentity';
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${String(Math.floor(ticks/20)%60).padStart(2,'0')}.${String(ticks%20*5).padStart(2,'0')}`;
export default function PendingSubmissions({query=''}:{query?:string}){
 const {submissions,error}=usePublicSubmissions(),q=query.trim().toLowerCase();
 const visible=submissions.filter(s=>!q||[s.trackHash,s.track,s.driver,s.car].some(v=>v.toLowerCase().includes(q)));
 if(!visible.length)return error?<p role="status"><WebsiteText text="Verification status is temporarily unavailable."/></p>:null;
 return <section className="pending-submissions" aria-labelledby="pending-submissions-heading"><h3 id="pending-submissions-heading"><WebsiteText text="Submitted runs — unranked"/></h3><p><WebsiteText text="Pending times are player claims, not verified records. They enter Valid or Exploit detected only after the server check finishes."/></p><ul>{visible.map(s=><li key={s.id}><div><strong>{s.driver}</strong><span>{s.track} · {s.car} · {s.physicsEngine==='ms-1991'?'MS 1991':s.physicsEngine==='ms-1990'?'MS 1990':'BB 1991'}</span><TrackIdentity hash={s.trackHash}/></div><strong>{time(s.ticks)}</strong><div><span className={'verification-badge '+(s.state==='rejected'?'verification-failed':'')}><WebsiteText text={s.state==='rejected'?'Verification failed':'Under verification'}/></span>{s.state==='retry'&&<small><WebsiteText text="Verification is delayed. It will retry automatically."/></small>}</div></li>)}</ul></section>;
}
