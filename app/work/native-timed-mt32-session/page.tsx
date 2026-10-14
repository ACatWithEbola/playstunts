'use client';
import {useEffect,useRef,useState} from 'react';
import {createBrowserMt32Power} from '@/lib/game/browser-native-mt32-music';
import {createBrowserNativeTimedMt32Music} from '@/lib/game/browser-native-timed-mt32-music';
import {PC_PIT_INPUT_HZ,ORIGINAL_PIT_DIVISOR} from '@/lib/game/timer-interrupt';
import type {NativeMusicScore} from '@/lib/game/native-music-score';
import {createRetainedMenuClockOwner} from '@/lib/game/retained-menu-clock-owner';
import {createClockOwnedTimedMusic} from '@/lib/game/clock-owned-timed-music';
type Music=Awaited<ReturnType<typeof createBrowserNativeTimedMt32Music>>['music'];
type Session={context:AudioContext;power:ReturnType<typeof createBrowserMt32Power>;abort:AbortController;music?:Music;hardware:number;guarded:number;clock:ReturnType<typeof createRetainedMenuClockOwner>};
export default function TimedRolandSession(){
 const active=useRef<Session|undefined>(undefined),busy=useRef(false);
 const [status,setStatus]=useState('Local test only · Ready'),[pending,setPending]=useState(false),[paused,setPaused]=useState(false),[playing,setPlaying]=useState(false),[ticks,setTicks]=useState('0 hardware ticks · 0 guarded');
 useEffect(()=>()=>{const session=active.current;active.current=undefined;if(!session)return;session.abort.abort();void (session.music?.closeAsync()??Promise.resolve()).catch(()=>{}).finally(()=>{session.power.close();void session.context.close().catch(()=>{});});},[]);
 const run=async(action:(session:Session)=>Promise<void>)=>{
  if(busy.current)return;busy.current=true;setPending(true);
  try{
   if(!['localhost','127.0.0.1','[::1]'].includes(window.location.hostname))throw Error('This diagnostic requires localhost');
   let session=active.current;
   if(!session){const epoch=performance.now();session={context:new AudioContext(),power:createBrowserMt32Power(),abort:new AbortController(),hardware:0,guarded:0,clock:createRetainedMenuClockOwner({callbackCounter:0,gameCounter:0,divisor:5,countdown:5},()=>Math.floor((performance.now()-epoch)*PC_PIT_INPUT_HZ/(ORIGINAL_PIT_DIVISOR*1000)))};active.current=session;}
   await session.context.resume();
   if(!session.music){
    setStatus('Preparing timed Roland controller…');
    const identity=new URLSearchParams(window.location.search).get('play-engine')==='ms-1990'?'ms-1990':'ms-1991';
    const current=session;
    const connection=await createBrowserNativeTimedMt32Music(session.context,session.abort.signal,session.power,identity,{cpuHz:4772728,pollCycles:20,resetClocks:Math.ceil(.014*PC_PIT_INPUT_HZ),initialPort61:0,interrupts(){},yieldTask:()=>new Promise(resolve=>setTimeout(resolve,0))},dispatch=>{current.hardware++;if(!dispatch)current.guarded++;current.clock.audioTick();});
    if(active.current!==session){await connection.music.closeAsync();return;}
    session.music=createClockOwnedTimedMusic(connection.music,session.clock);
   }
   await action(session);
   if(active.current===session)setTicks(`${session.hardware} hardware ticks · ${session.guarded} guarded · Clock owner: ${session.clock.source} · Input ticks: ${session.clock.inputClock.counter()} · Game ticks: ${session.clock.inputClock.gameCounter()}`);
  }catch(error){if(active.current){setStatus(String(error));setPlaying(false);}}
  finally{busy.current=false;if(active.current)setPending(false);}
 };
 const play=(name:NativeMusicScore)=>run(async session=>{setStatus('Loading '+name+'…');await session.music!.playAsync(name);setPaused(session.music!.settings.paused);setPlaying(true);setStatus('Playing '+name+' · timed controller');});
 const pause=()=>run(async session=>{await session.music!.controlAsync(paused?'resume-audio':'pause-audio');setPaused(session.music!.settings.paused);setStatus(session.music!.settings.paused?'Paused':'Resumed');});
 const stop=()=>run(async session=>{await session.music!.stopAsync();setPlaying(false);setStatus('Stopped · device released');});
 return <main className="game-shell"><a href="/work/native-mt32-check">Back to Roland check</a><h1>Timed Roland session test</h1><p>Local diagnostic using the browser music controller. The nominal CPU timing profile is a test fixture, not verified original hardware timing.</p><div>{(['titl','slct','vict','over'] as const).map(name=><button key={name} disabled={pending} onClick={()=>void play(name)}>{({titl:'Title',slct:'Menu',vict:'Victory',over:'Game over'})[name]}</button>)}<button disabled={pending||!playing} onClick={()=>void pause()}>{paused?'Resume':'Pause'}</button><button disabled={pending||!playing} onClick={()=>void stop()}>Stop</button></div><p role="status">{status}</p><p>{ticks}</p><p>No release/default setting or saved files are changed.</p></main>;
}
