'use client';
import {useEffect,useState} from 'react';
import {Trophy,TrendingUp,Check,Flag} from 'lucide-react';
import {WebsiteText,useWebsiteLocale} from './WebsiteLanguage';
import {usePublicSubmissions} from './usePublicSubmissions';
type Race={id:string;driver:string;track:string;car:string;ticks:number;postedAt:number;event:string;valid:boolean;improvement:number|null};
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${String(Math.floor(ticks/20)%60).padStart(2,'0')}.${String((ticks%20)*5).padStart(2,'0')}`;
export default function RecentRacesPanel(){
 const {submissions}=usePublicSubmissions();
 const locale=useWebsiteLocale(),[races,setRaces]=useState<Race[]>([]),[state,setState]=useState('loading'),[now,setNow]=useState(Date.now());
 useEffect(()=>{const controller=new AbortController();let pending=false;const refresh=async()=>{if(pending||document.hidden)return;pending=true;try{const response=await fetch('/api/recent-races',{signal:controller.signal});if(!response.ok)throw Error('Unavailable');const body=await response.json() as {races:Race[]};if(!controller.signal.aborted){setRaces(body.races.slice(0,7));setState('ready');setNow(Date.now());}}catch{if(!controller.signal.aborted)setState('error');}finally{pending=false;}};void refresh();const timer=setInterval(()=>void refresh(),10000);const visible=()=>{if(!document.hidden)void refresh();};document.addEventListener('visibilitychange',visible);window.addEventListener('stunts-score-verification-changed',visible);return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',visible);window.removeEventListener('stunts-score-verification-changed',visible);};},[]);
 const relative=(stamp:number)=>{const seconds=Math.max(0,Math.floor(now/1000)-stamp);const unit=seconds<3600?'minute':seconds<86400?'hour':'day';const value=Math.floor(seconds/(unit==='minute'?60:unit==='hour'?3600:86400));return new Intl.RelativeTimeFormat(locale,{numeric:'auto'}).format(-value,unit);};
 return <section className="recent-races-panel" aria-labelledby="recent-races-heading">
<h3 id="recent-races-heading">
<WebsiteText text="RECENT RACES"/>
</h3>{submissions.length>0&&<ol className="recent-pending-races">{submissions.slice(0,7).map(run=><li key={run.id}><Flag size={18} aria-hidden="true"/><div><p className="recent-race-heading"><strong>{run.driver}</strong></p><span className="verification-badge"><WebsiteText text={run.state==='rejected'?'Verification failed':'Verifying...'}/></span><div className="recent-race-result"><strong>{time(run.ticks)}</strong></div><small><WebsiteText text="Track:"/> {run.track}</small><small><WebsiteText text="Car:"/> {run.car}</small></div></li>)}</ol>}{state==='loading'?<p>
<WebsiteText text="Loading recent races…"/>
</p>:state==='error'&&!races.length?<p>
<WebsiteText text="Recent races are temporarily unavailable."/>
</p>:!races.length?submissions.length?null:<p>
<WebsiteText text="No public races yet."/>
</p>:<ol>{races.map(race=>{const valid=race.valid??(race.event==='valid'||race.event==='record');const Icon=race.event==='record'?Trophy:race.event==='improved'?TrendingUp:valid?Check:Flag;return <li key={race.id}>
<Icon size={18} aria-hidden="true"/>
<div>
<p className="recent-race-heading">
<strong>{race.driver}</strong>{' '}
<span className={'recent-race-status '+(race.event==='record'||race.event==='improved'?'recent-status-positive':!valid?'recent-status-invalid':'')}>
<WebsiteText text={race.event==='record'?'set a new high score':race.event==='improved'?'improved their time':valid?'finished at':'ran an invalid run'}/>
</span>
</p>
<div className="recent-race-result">
<strong>{time(race.ticks)}{race.improvement!==null&&<span> · −{(race.improvement/20).toFixed(2)}s</span>}</strong>
</div>
<small>
<WebsiteText text="Track:"/> {race.track}</small>
<small>
<WebsiteText text="Car:"/> {race.car}</small>
<div className="recent-race-result">
<time dateTime={new Date(race.postedAt*1000).toISOString()}>{relative(race.postedAt)}</time>
</div>
</div>
</li>;})}</ol>}</section>;
}
