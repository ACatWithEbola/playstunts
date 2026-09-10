'use client';
import {useEffect,useRef,useState} from 'react';
import OpeningSequence from '../../OpeningSequence';
import {useRolandDevice} from '../../use-roland-device';
import {RolandDevicePanel} from '../../RolandDevicePanel';
import type {Assets} from '@/lib/game/types';
export default function NativeMt32GameCheck(){
 const roland=useRolandDevice();
 const root=useRef<HTMLElement>(null),[raceDiagnostic,setRaceDiagnostic]=useState('No race running');
 const [assets,setAssets]=useState<Assets|null>(null),[error,setError]=useState(''),[session,setSession]=useState(0);
 useEffect(()=>{const controller=new AbortController();fetch('/game/assets.json',{signal:controller.signal}).then(response=>{if(!response.ok)throw Error('Original game assets could not load');return response.json();}).then(value=>setAssets(value as Assets)).catch(reason=>{if(!controller.signal.aborted)setError(String(reason));});return()=>controller.abort();},[]);
 useEffect(()=>{const timer=setInterval(()=>{const data=root.current?.querySelector('canvas')?.dataset;if(!data?.raceFrame){setRaceDiagnostic('No race running');return;}setRaceDiagnostic(`Frame ${data.raceFrame}; clock ${data.raceClock}; clock blocked ${data.raceClockBlocked}; audio ${data.raceAudioState}; audio time ${Number(data.raceAudioTime).toFixed(2)}`);},500);return()=>clearInterval(timer);},[]);
 return <main ref={root} className="game-shell"><a href="/work/native-mt32-check">← Roland sound check</a><h1>Roland game check</h1><p>Use the panel below to adjust the game’s Roland sound. Startup timing is still under verification.</p>{assets&&roland.power?<OpeningSequence key={`game-${session}`} assets={assets} soundDevice="mt32" rolandPower={roland.power} onRunningChange={roland.setGameRunning} onBack={()=>setSession(value=>value+1)} backLabel="Restart"/>:<p>{error||'Loading Stunts…'}</p>}<RolandDevicePanel roland={roland}/><details><summary>Race diagnostics</summary><p>{raceDiagnostic}</p></details></main>;
}
