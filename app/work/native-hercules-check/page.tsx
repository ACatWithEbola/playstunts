'use client';
import {useEffect,useState} from 'react';
import OpeningSequence from '../../OpeningSequence';
import type {Assets} from '@/lib/game/types';
export default function NativeHerculesCheck(){
 const [assets,setAssets]=useState<Assets|null>(null),[error,setError]=useState(''),[session,setSession]=useState(0);
 useEffect(()=>{const controller=new AbortController();fetch('/game/assets.json',{signal:controller.signal}).then(response=>{if(!response.ok)throw Error('Original game assets could not load');return response.json();}).then(value=>setAssets(value as Assets)).catch(reason=>{if(!controller.signal.aborted)setError(String(reason));});return()=>controller.abort();},[]);
 return <main><a href="/">← Back to game</a><h1>Original Hercules display check</h1>{assets?<OpeningSequence key={session} assets={assets} displayMode="cga" hercules onBack={()=>setSession(value=>value+1)} backLabel="Restart"/>:<p>{error||'Loading Stunts…'}</p>}</main>;
}
