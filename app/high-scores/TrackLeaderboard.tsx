'use client';
import {WebsiteText,WebsiteElement,useWebsiteLocale} from '@/app/WebsiteLanguage';
import {useEffect,useState} from 'react';
import {ChevronDown,Flag,Trophy} from 'lucide-react';
import type {Leaderboard} from '@/lib/server/public-leaderboards';
import RouteBadge from './RouteBadge';
import DriverHistory from './DriverHistory';
import {routeDisplay} from '@/lib/server/route-display';
import RankTrophy from './RankTrophy';
import type {RouteAssessment} from '@/lib/server/shortcut-assessment';
const categories=[['full_route','Valid'],['shortcuts_detected','Exploit detected']] as const;
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${(Math.floor(ticks/20)%60).toString().padStart(2,'0')}.${((ticks%20)*5).toString().padStart(2,'0')}`;
export default function TrackLeaderboard({board}:{board:Leaderboard}){
 const locale=useWebsiteLocale();
 const [mode,setMode]=useState<'overall'|'car'>('overall'),[code,setCode]=useState('');
 const [category,setCategory]=useState<'full_route'|'shortcuts_detected'>('full_route');
 const [visible,setVisible]=useState(10);
 useEffect(()=>setVisible(10),[mode,code,category,board.hash]);
 const car=board.cars.find(car=>car.code===code)??board.cars[0];
 const group=board.categories?.[category];
 const record=board.categories?.full_route.scores[0];
 const carRecords=(board.categories?.full_route.cars??[]).filter(item=>item.scores.length).map(item=>({code:item.code,name:item.name,score:item.scores[0]})).sort((a,b)=>a.score.ticks-b.score.ticks||a.name.localeCompare(b.name));
 const scores=mode==='car'?(group?.cars.find(item=>item.code===car?.code)?.scores??[]):(group?.scores??[]),fastest=scores[0];
 return <article className="scores-board" aria-labelledby={'track-'+board.hash}>
  <header><div><span className="scores-track-label"><Flag size={12} aria-hidden="true"/><WebsiteText text={" TRACK LEADERBOARD"}/></span><h3 id={'track-'+board.hash}>{board.name}</h3></div><div className="scores-record"><div className="scores-record-driver">{record&&<><strong><Trophy className="leader-trophy" size={22} aria-hidden="true"/>{record.driver}</strong><span>{record.car}</span></>}</div><span className="scores-best"><small><WebsiteText text="VALID TRACK RECORD"/></small><strong className={record?'leader-time':undefined}>{record?time(record.ticks):'—'}</strong>{record&&<RouteBadge assessment="full_route"/>}</span></div></header>
  {!!carRecords.length&&<details className="scores-car-records">
   <summary><h4><WebsiteText text="CAR RECORDS"/></h4><ChevronDown size={20} aria-hidden="true"/></summary><p><WebsiteText text="Best valid time for each car · fastest first"/></p>
   <div className="scores-car-record-grid">{carRecords.map(item=><button type="button" key={item.code} aria-pressed={mode==='car'&&category==='full_route'&&car?.code===item.code} onClick={()=>{setCategory('full_route');setMode('car');setCode(item.code);setVisible(10);}}><span className="scores-car-record-copy"><span className="scores-car-record-name">{item.name}</span><span className="scores-car-record-driver">{item.score.driver}</span><strong>{time(item.score.ticks)}</strong><span className="scores-car-record-link"><WebsiteText text="View ranking"/> →</span></span>{['ANSX','AUDI','COUN','FGTO','JAGU','LANC','LM02','P962','PC04','PMIN','VETT'].includes(item.code)&&<img className="scores-car-blueprint" src={'/car-blueprints/'+item.code+'.svg'} alt="" aria-hidden="true" loading="lazy" width={240} height={130}/>}</button>)}</div>
  </details>}
  <div className="scores-ranking-controls">
   <WebsiteElement as="div" className="scores-category-switch" role="group" aria-label="Run category">
    {categories.map(([value,label])=><button key={value} type="button" aria-pressed={category===value} onClick={()=>setCategory(value)}><WebsiteText text={label}/></button>)}
   </WebsiteElement>
   <WebsiteElement as="div" className="scores-ranking-switch" role="group" aria-label={'Ranking for '+board.name}>
    <button type="button" aria-pressed={mode==='overall'} onClick={()=>setMode('overall')}><Trophy size={14} aria-hidden="true"/><WebsiteText text={" Overall"}/></button>
    <button type="button" aria-pressed={mode==='car'} onClick={()=>setMode('car')}><WebsiteText text={"By car "}/><span>{board.cars.length}</span></button>
   </WebsiteElement>
   {mode==='car'&&car&&<div className="scores-car-select"><label className="scores-sr" htmlFor={'car-'+board.hash}><WebsiteText text={"Choose car for "}/>{board.name}</label><select id={'car-'+board.hash} value={car.code} onChange={event=>setCode(event.target.value)}>{board.cars.map(car=><option key={car.code} value={car.code}>{car.name}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></div>}
   <p><WebsiteText text={category==='full_route'?"Valid runs only, fastest first.":"Runs with detected exploits, fastest first."}/><span><WebsiteText text={"ONE PLACE PER NAMED DRIVER · "}/>{mode==='overall'?<WebsiteText text={'ALL CARS'}/>:<WebsiteText text={'SELECTED CAR'}/>}<WebsiteText text={" · HOVER OR TAP A NAME FOR RECENT RUNS"}/></span></p>
  </div>
  {!scores.length?<div className="scores-category-empty"><Flag size={24} aria-hidden="true"/><h4><WebsiteText text={"No times yet"}/></h4><p><WebsiteText text={"Finish a qualifying race to join this track’s leaderboard."}/></p></div>:<div className="scores-table-wrap"><table><caption className="scores-sr"><WebsiteText text={"Top 100 drivers for "}/>{board.name}{mode==='car'&&car?' in '+car.name:<WebsiteText text={' overall'}/>} · <WebsiteText text={categories.find(([value])=>value===category)![1]}/></caption><thead><tr><th scope="col">#</th><th scope="col"><WebsiteText text={"DRIVER / CAR"}/></th><th scope="col"><WebsiteText text={"TIME"}/></th><th scope="col"><WebsiteText text={"ROUTE / DETAILS"}/></th></tr></thead><tbody>{scores.slice(0,visible).map((score,index)=><tr key={score.id} className={index===0?'scores-winner':undefined}><td>{index<3?<RankTrophy rank={index+1}/>:<span className="scores-rank">{String(index+1).padStart(2,'0')}</span>}</td><td><DriverHistory score={score} track={board.name}/><span className="scores-car">{score.car}</span></td><td className="scores-time"><strong>{time(score.ticks)}</strong>{index>0&&<small>+{((score.ticks-fastest!.ticks)/20).toFixed(2)}s</small>}</td><td><RouteBadge assessment={score.routeAssessment} reason={score.assessmentReason}/><details className="scores-details"><summary><WebsiteText text={"Run details"}/></summary><p><WebsiteText text={"Posted "}/>{new Date(score.postedAt*1000).toLocaleDateString(locale,{day:'numeric',month:'short',year:'numeric'})}<br/><WebsiteText text={"Car: "}/>{score.carCode}<br/>{score.opponent?<WebsiteText text={`Opponent: ${score.opponent}${score.opponentAhead?' (finished ahead)':''}`}/>:<WebsiteText text={'Solo race'}/>}</p><p className="scores-route-note">{<WebsiteText text={routeDisplay(score.routeAssessment).detail}/>}</p>{score.replay?<a href={'/api/replays?id='+score.id} download><WebsiteText text={"Download replay ↗"}/></a>:<span><WebsiteText text={"No public replay"}/></span>}</details>{score.replay&&<span className="scores-replay-dot"><WebsiteText text={"REPLAY"}/></span>}</td></tr>)}</tbody></table></div>}
  {scores.length>10&&<div className="scores-expand"><span aria-live="polite">{Math.min(visible,scores.length)} / {scores.length}</span>{visible<scores.length&&<button type="button" onClick={()=>setVisible(value=>Math.min(value+10,100))}><WebsiteText text="Show 10 more"/></button>}{visible>10&&<button type="button" onClick={()=>setVisible(10)}><WebsiteText text="Show top 10"/></button>}</div>}
  <footer><span>{scores.length}<WebsiteText text={" / 100 places filled"}/> · <WebsiteText text={categories.find(([value])=>value===category)![1]}/></span><details><summary><WebsiteText text={"Track identity"}/></summary><code>{board.hash}</code><p><WebsiteText text={"Matching file contents share this board."}/></p></details></footer>
 </article>;
}
