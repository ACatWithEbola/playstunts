'use client';

import {useEffect,useState} from 'react';
import Garage from '../Garage';
import type {Assets} from '@/lib/game/types';

export default function CarsPage(){
 const [assets,setAssets]=useState<Assets|null>(null),[error,setError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  fetch('/game/assets.json',{signal:controller.signal}).then(response=>{
   if(!response.ok)throw Error('The 3D car files could not load. Please reload the page.');
   return response.json();
  }).then(value=>setAssets(value as Assets)).catch(reason=>{
   if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:String(reason));
  });
  return()=>controller.abort();
 },[]);
 return <main className="game-shell"><header><button className="wordmark" onClick={()=>window.location.assign('/')} aria-label="Play Stunts home">STUNTS</button><div className="version-links"><span>3D car showroom</span><a href="/">← Play Stunts</a></div></header>{assets?<Garage assets={assets} onBack={()=>window.location.assign('/')}/>:<section className="showroom-loading"><p role={error?'alert':'status'}>{error||'Loading cars…'}</p></section>}<footer><span>Original car geometry and colours · upgraded materials and lighting</span><span>Drag to rotate · scroll to zoom</span></footer></main>;
}
