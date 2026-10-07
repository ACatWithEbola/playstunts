'use client';
import {useState} from 'react';
import {ChevronDown,Flag,Trophy} from 'lucide-react';
import type {Leaderboard} from '@/lib/server/public-leaderboards';
import RouteBadge from './RouteBadge';
import DriverHistory from './DriverHistory';
import {routeDisplay} from '@/lib/server/route-display';
import RankTrophy from './RankTrophy';
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${(Math.floor(ticks/20)%60).toString().padStart(2,'0')}.${((ticks%20)*5).toString().padStart(2,'0')}`;
export default function TrackLeaderboard({board}:{board:Leaderboard}){
 const [mode,setMode]=useState<'overall'|'car'>('overall'),[code,setCode]=useState('');
 const car=board.cars.find(car=>car.code===code)??board.cars[0],scores=mode==='car'&&car?car.scores:board.scores,fastest=scores[0];
 return <article className="scores-board" aria-labelledby={'track-'+board.hash}>
  <header><div><span className="scores-track-label"><Flag size={12} aria-hidden="true"/> TRACK LEADERBOARD</span><h3 id={'track-'+board.hash}>{board.name}</h3></div><span className="scores-best"><small>{mode==='car'?'CAR RECORD':'TRACK RECORD'}</small><strong>{fastest?time(fastest.ticks):'—'}</strong>{fastest&&<RouteBadge assessment={fastest.routeAssessment}/>}</span></header>
  <div className="scores-ranking-controls">
   <div className="scores-ranking-switch" role="group" aria-label={'Ranking for '+board.name}>
    <button type="button" aria-pressed={mode==='overall'} onClick={()=>setMode('overall')}><Trophy size={14} aria-hidden="true"/> Overall</button>
    <button type="button" aria-pressed={mode==='car'} onClick={()=>setMode('car')}>By car <span>{board.cars.length}</span></button>
   </div>
   {mode==='car'&&car&&<div className="scores-car-select"><label className="scores-sr" htmlFor={'car-'+board.hash}>Choose car for {board.name}</label><select id={'car-'+board.hash} value={car.code} onChange={event=>setCode(event.target.value)}>{board.cars.map(car=><option key={car.code} value={car.code}>{car.name}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></div>}
   <p>All accepted times, fastest first. Each run keeps its route label.<span>ONE PLACE PER NAMED DRIVER · {mode==='overall'?'ALL CARS':'SELECTED CAR'} · HOVER OR TAP A NAME FOR RECENT RUNS</span></p>
  </div>
  {!scores.length?<div className="scores-category-empty"><Flag size={24} aria-hidden="true"/><h4>No times yet</h4><p>Finish a qualifying race to join this track’s leaderboard.</p></div>:<div className="scores-table-wrap"><table><caption className="scores-sr">Top seven drivers for {board.name}{mode==='car'&&car?' in '+car.name:' overall'}, all route categories</caption><thead><tr><th scope="col">#</th><th scope="col">DRIVER / CAR</th><th scope="col">TIME</th><th scope="col">ROUTE / DETAILS</th></tr></thead><tbody>{scores.map((score,index)=><tr key={score.id} className={index===0?'scores-winner':undefined}><td>{index<3?<RankTrophy rank={index+1}/>:<span className="scores-rank">{String(index+1).padStart(2,'0')}</span>}</td><td><DriverHistory score={score} track={board.name}/><span className="scores-car">{score.car}</span></td><td className="scores-time"><strong>{time(score.ticks)}</strong>{index>0&&<small>+{((score.ticks-fastest!.ticks)/20).toFixed(2)}s</small>}</td><td><RouteBadge assessment={score.routeAssessment}/><details className="scores-details"><summary>Run details</summary><p>Posted {new Date(score.postedAt*1000).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}<br/>Car: {score.carCode}<br/>{score.opponent?`Opponent: ${score.opponent}${score.opponentAhead?' (finished ahead)':''}`:'Solo race'}</p><p className="scores-route-note">{routeDisplay(score.routeAssessment).detail}</p>{score.replay?<a href={'/api/replays?id='+score.id} download>Download replay ↗</a>:<span>No public replay</span>}</details>{score.replay&&<span className="scores-replay-dot">REPLAY</span>}</td></tr>)}</tbody></table></div>}
  <footer><span>{scores.length} / 7 places filled · All route categories</span><details><summary>Track identity</summary><code>{board.hash}</code><p>Matching file contents share this board.</p></details></footer>
 </article>;
}
