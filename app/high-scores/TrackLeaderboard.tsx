'use client';
import {WebsiteText,WebsiteElement,useWebsiteLocale} from '@/app/WebsiteLanguage';
import {useState} from 'react';
import {ChevronDown,Flag,Trophy} from 'lucide-react';
import type {Leaderboard} from '@/lib/server/public-leaderboards';
import RouteBadge from './RouteBadge';
import DriverHistory from './DriverHistory';
import {routeDisplay} from '@/lib/server/route-display';
import RankTrophy from './RankTrophy';
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${(Math.floor(ticks/20)%60).toString().padStart(2,'0')}.${((ticks%20)*5).toString().padStart(2,'0')}`;
export default function TrackLeaderboard({board}:{board:Leaderboard}){
 const locale=useWebsiteLocale();
 const [mode,setMode]=useState<'overall'|'car'>('overall'),[code,setCode]=useState('');
 const car=board.cars.find(car=>car.code===code)??board.cars[0],scores=mode==='car'&&car?car.scores:board.scores,fastest=scores[0];
 return <article className="scores-board" aria-labelledby={'track-'+board.hash}>
  <header><div><span className="scores-track-label"><Flag size={12} aria-hidden="true"/><WebsiteText text={" TRACK LEADERBOARD"}/></span><h3 id={'track-'+board.hash}>{board.name}</h3></div><span className="scores-best"><small>{mode==='car'?<WebsiteText text={'CAR RECORD'}/>:<WebsiteText text={'TRACK RECORD'}/>}</small><strong>{fastest?time(fastest.ticks):<WebsiteText text={'—'}/>}</strong>{fastest&&<RouteBadge assessment={fastest.routeAssessment}/>}</span></header>
  <div className="scores-ranking-controls">
   <WebsiteElement as="div" className="scores-ranking-switch" role="group" aria-label={'Ranking for '+board.name}>
    <button type="button" aria-pressed={mode==='overall'} onClick={()=>setMode('overall')}><Trophy size={14} aria-hidden="true"/><WebsiteText text={" Overall"}/></button>
    <button type="button" aria-pressed={mode==='car'} onClick={()=>setMode('car')}><WebsiteText text={"By car "}/><span>{board.cars.length}</span></button>
   </WebsiteElement>
   {mode==='car'&&car&&<div className="scores-car-select"><label className="scores-sr" htmlFor={'car-'+board.hash}><WebsiteText text={"Choose car for "}/>{board.name}</label><select id={'car-'+board.hash} value={car.code} onChange={event=>setCode(event.target.value)}>{board.cars.map(car=><option key={car.code} value={car.code}>{car.name}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></div>}
   <p><WebsiteText text={"All accepted times, fastest first. Each run keeps its route label."}/><span><WebsiteText text={"ONE PLACE PER NAMED DRIVER · "}/>{mode==='overall'?<WebsiteText text={'ALL CARS'}/>:<WebsiteText text={'SELECTED CAR'}/>}<WebsiteText text={" · HOVER OR TAP A NAME FOR RECENT RUNS"}/></span></p>
  </div>
  {!scores.length?<div className="scores-category-empty"><Flag size={24} aria-hidden="true"/><h4><WebsiteText text={"No times yet"}/></h4><p><WebsiteText text={"Finish a qualifying race to join this track’s leaderboard."}/></p></div>:<div className="scores-table-wrap"><table><caption className="scores-sr"><WebsiteText text={"Top seven drivers for "}/>{board.name}{mode==='car'&&car?' in '+car.name:<WebsiteText text={' overall'}/>}<WebsiteText text={", all route categories"}/></caption><thead><tr><th scope="col">#</th><th scope="col"><WebsiteText text={"DRIVER / CAR"}/></th><th scope="col"><WebsiteText text={"TIME"}/></th><th scope="col"><WebsiteText text={"ROUTE / DETAILS"}/></th></tr></thead><tbody>{scores.map((score,index)=><tr key={score.id} className={index===0?'scores-winner':undefined}><td>{index<3?<RankTrophy rank={index+1}/>:<span className="scores-rank">{String(index+1).padStart(2,'0')}</span>}</td><td><DriverHistory score={score} track={board.name}/><span className="scores-car">{score.car}</span></td><td className="scores-time"><strong>{time(score.ticks)}</strong>{index>0&&<small>+{((score.ticks-fastest!.ticks)/20).toFixed(2)}s</small>}</td><td><RouteBadge assessment={score.routeAssessment}/><details className="scores-details"><summary><WebsiteText text={"Run details"}/></summary><p><WebsiteText text={"Posted "}/>{new Date(score.postedAt*1000).toLocaleDateString(locale,{day:'numeric',month:'short',year:'numeric'})}<br/><WebsiteText text={"Car: "}/>{score.carCode}<br/>{score.opponent?<WebsiteText text={`Opponent: ${score.opponent}${score.opponentAhead?' (finished ahead)':''}`}/>:<WebsiteText text={'Solo race'}/>}</p><p className="scores-route-note">{<WebsiteText text={routeDisplay(score.routeAssessment).detail}/>}</p>{score.replay?<a href={'/api/replays?id='+score.id} download><WebsiteText text={"Download replay ↗"}/></a>:<span><WebsiteText text={"No public replay"}/></span>}</details>{score.replay&&<span className="scores-replay-dot"><WebsiteText text={"REPLAY"}/></span>}</td></tr>)}</tbody></table></div>}
  <footer><span>{scores.length}<WebsiteText text={" / 7 places filled · All route categories"}/></span><details><summary><WebsiteText text={"Track identity"}/></summary><code>{board.hash}</code><p><WebsiteText text={"Matching file contents share this board."}/></p></details></footer>
 </article>;
}
