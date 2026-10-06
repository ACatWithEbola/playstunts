'use client';
import {useState} from 'react';
import {ChevronDown,Flag,Trophy} from 'lucide-react';
import type {Leaderboard} from '@/lib/server/public-leaderboards';
import type {RouteAssessment} from '@/lib/server/shortcut-assessment';
import RouteBadge from './RouteBadge';
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${(Math.floor(ticks/20)%60).toString().padStart(2,'0')}.${((ticks%20)*5).toString().padStart(2,'0')}`;
const labels:Record<RouteAssessment,string>={full_route:'Full route',shortcuts_detected:'Shortcuts / exploits',not_assessed:'Unassessed'};
export default function TrackLeaderboard({board}:{board:Leaderboard}){
 const [mode,setMode]=useState<'overall'|'car'>('overall'),[code,setCode]=useState('');
 const [category,setCategory]=useState<RouteAssessment>(board.categories?.full_route.scores.length?'full_route':board.categories?.shortcuts_detected.scores.length?'shortcuts_detected':'not_assessed');
 const group=board.categories?.[category]??{scores:category==='not_assessed'?board.scores:[],cars:category==='not_assessed'?board.cars:[]};
 const car=group.cars.find(car=>car.code===code)??group.cars[0],scores=mode==='car'&&car?car.scores:group.scores,fastest=scores[0];
 return <article className="scores-board" aria-labelledby={'track-'+board.hash}>
  <header><div><span className="scores-track-label"><Flag size={12} aria-hidden="true"/> TRACK LEADERBOARD</span><h3 id={'track-'+board.hash}>{board.name}</h3></div><span className="scores-best"><small>{labels[category].toUpperCase()} {mode==='car'?'CAR RECORD':'RECORD'}</small><strong>{fastest?time(fastest.ticks):'—'}</strong></span></header>
  <div className="scores-ranking-controls">
   <div className="scores-route-switch" role="group" aria-label={'Route category for '+board.name}>
    {(Object.keys(labels) as RouteAssessment[]).map(key=><button key={key} type="button" aria-pressed={category===key} onClick={()=>{setCategory(key);setCode('');}}>{labels[key]}<span>{board.categories?.[key].scores.length??(key==='not_assessed'?board.scores.length:0)}</span></button>)}
   </div>
   <div className="scores-ranking-switch" role="group" aria-label={'Ranking for '+board.name}>
    <button type="button" aria-pressed={mode==='overall'} onClick={()=>setMode('overall')}><Trophy size={14} aria-hidden="true"/> Overall</button>
    <button type="button" aria-pressed={mode==='car'} onClick={()=>setMode('car')}>By car <span>{group.cars.length}</span></button>
   </div>
   {mode==='car'&&car&&<div className="scores-car-select"><label className="scores-sr" htmlFor={'car-'+board.hash}>Choose car for {board.name}</label><select id={'car-'+board.hash} value={car.code} onChange={event=>setCode(event.target.value)}>{group.cars.map(car=><option key={car.code} value={car.code}>{car.name}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></div>}
   <p>{category==='not_assessed'?'These routes are not conclusively classified.':category==='shortcuts_detected'?'Confirmed shortcuts or grass-speed exploits. Valid under the original rules.':'Positive replay evidence of a complete connected route.'}<span>ONE PLACE PER NAMED DRIVER · {mode==='overall'?'ALL CARS':'SELECTED CAR'}</span></p>
  </div>
  {!scores.length?<div className="scores-category-empty"><Flag size={24} aria-hidden="true"/><h4>No {labels[category].toLowerCase()} times yet</h4><p>{category==='full_route'?'A run needs positive route evidence to appear here. Uncertain runs stay in Unassessed.':'Switch category to see other accepted times.'}</p></div>:<div className="scores-table-wrap"><table><caption className="scores-sr">Top seven {labels[category]} drivers for {board.name}{mode==='car'&&car?' in '+car.name:' overall'}</caption><thead><tr><th scope="col">#</th><th scope="col">DRIVER / CAR</th><th scope="col">TIME</th><th scope="col">DETAILS</th></tr></thead><tbody>{scores.map((score,index)=><tr key={score.id} className={index===0?'scores-winner':undefined}><td><span className="scores-rank">{String(index+1).padStart(2,'0')}</span></td><td><strong className="scores-driver">{score.driver}</strong><span className="scores-car">{score.car}</span></td><td className="scores-time"><strong>{time(score.ticks)}</strong>{index>0&&<small>+{((score.ticks-fastest!.ticks)/20).toFixed(2)}s</small>}</td><td><RouteBadge assessment={score.routeAssessment}/><details className="scores-details"><summary>Run details</summary><p>Posted {new Date(score.postedAt*1000).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}<br/>Car: {score.carCode}<br/>{score.opponent?`Opponent: ${score.opponent}${score.opponentAhead?' (finished ahead)':''}`:'Solo race'}</p><p className="scores-route-note">{score.routeAssessment==='full_route'?'Replay witnesses a complete connected route, including its available geometric gates.':score.routeAssessment==='shortcuts_detected'?'Replay confirms a substantial grass shortcut or sustained grass-speed exploit. Original rules still apply; this score remains eligible.':'The route has not been conclusively assessed. This is not a claim of shortcut-free driving. Older scores, ambiguous paths and unconfirmed stunt execution remain unassessed.'}</p>{score.replay?<a href={'/api/replays?id='+score.id} download>Download replay ↗</a>:<span>No public replay</span>}</details>{score.replay&&<span className="scores-replay-dot">REPLAY</span>}</td></tr>)}</tbody></table></div>}
  <footer><span>{scores.length} / 7 places filled · {labels[category]}</span><details><summary>Track identity</summary><code>{board.hash}</code><p>Matching file contents share this board.</p></details></footer>
 </article>;
}
