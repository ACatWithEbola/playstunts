'use client';
import {useState} from 'react';
import {ChevronDown,Flag,Trophy} from 'lucide-react';
import type {Leaderboard} from '@/lib/server/public-leaderboards';
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${(Math.floor(ticks/20)%60).toString().padStart(2,'0')}.${((ticks%20)*5).toString().padStart(2,'0')}`;
export default function TrackLeaderboard({board}:{board:Leaderboard}){
 const [mode,setMode]=useState<'overall'|'car'>('overall'),[code,setCode]=useState('');
 const car=board.cars.find(car=>car.code===code)??board.cars[0],scores=mode==='car'&&car?car.scores:board.scores;
 const fastest=scores[0];if(!fastest)return null;
 return <article className="scores-board" aria-labelledby={'track-'+board.hash}>
  <header><div><span className="scores-track-label"><Flag size={12} aria-hidden="true"/> TRACK LEADERBOARD</span><h3 id={'track-'+board.hash}>{board.name}</h3></div><span className="scores-best"><small>{mode==='car'?'CAR RECORD':'TRACK RECORD'}</small><strong>{time(fastest.ticks)}</strong></span></header>
  <div className="scores-ranking-controls">
   <div className="scores-ranking-switch" role="group" aria-label={'Ranking for '+board.name}>
    <button type="button" aria-pressed={mode==='overall'} onClick={()=>setMode('overall')}><Trophy size={14} aria-hidden="true"/> Overall</button>
    <button type="button" aria-pressed={mode==='car'} onClick={()=>setMode('car')}>By car <span>{board.cars.length}</span></button>
   </div>
   {mode==='car'&&<div className="scores-car-select"><label className="scores-sr" htmlFor={'car-'+board.hash}>Choose car for {board.name}</label><select id={'car-'+board.hash} value={car?.code??''} onChange={event=>setCode(event.target.value)}>{board.cars.map(car=><option key={car.code} value={car.code}>{car.name}</option>)}</select><ChevronDown size={16} aria-hidden="true"/></div>}
   <p>{mode==='overall'?'Each driver’s fastest run, across all cars.':'Each driver’s best run in this car.'}<span>ONE PLACE PER NAMED DRIVER</span></p>
  </div>
  <div className="scores-table-wrap"><table><caption className="scores-sr">Top seven drivers for {board.name}{mode==='car'?' in '+car.name:' overall'}</caption><thead><tr><th scope="col">#</th><th scope="col">DRIVER / CAR</th><th scope="col">TIME</th><th scope="col">DETAILS</th></tr></thead><tbody>{scores.map((score,index)=><tr key={score.id} className={index===0?'scores-winner':undefined}><td><span className="scores-rank">{String(index+1).padStart(2,'0')}</span></td><td><strong className="scores-driver">{score.driver}</strong><span className="scores-car">{score.car}</span></td><td className="scores-time"><strong>{time(score.ticks)}</strong>{index>0&&<small>+{((score.ticks-fastest.ticks)/20).toFixed(2)}s</small>}</td><td><details className="scores-details"><summary>Run details</summary><p>Posted {new Date(score.postedAt*1000).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}<br/>Car: {score.carCode}<br/>{score.opponent?`Opponent: ${score.opponent}${score.opponentAhead?' (finished ahead)':''}`:'Solo race'}</p>{score.replay?<a href={'/api/replays?id='+score.id} download>Download replay ↗</a>:<span>No public replay</span>}</details>{score.replay&&<span className="scores-replay-dot">REPLAY</span>}</td></tr>)}</tbody></table></div>
  <footer><span>{scores.length} / 7 places filled · {mode==='overall'?'Overall':car.code}</span><details><summary>Track identity</summary><code>{board.hash}</code><p>Matching file contents share this board.</p></details></footer>
 </article>;
}
