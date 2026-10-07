'use client';
import {WebsiteText,WebsiteElement} from '@/app/WebsiteLanguage';
import {useEffect,useState} from 'react';
import type {CompletedScoreOffer} from '@/lib/game/completed-score-offer';
export default function GlobalScoreStatus(){
 const [message,setMessage]=useState('');
 const [offer,setOffer]=useState<CompletedScoreOffer|null>(null),[name,setName]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{const update=(event:Event)=>{setOffer((event as CustomEvent<CompletedScoreOffer|null>).detail);setMessage('');};window.addEventListener('stunts-completed-score',update);return()=>window.removeEventListener('stunts-completed-score',update);},[]);
 async function submit(){if(!offer||busy)return;setBusy(true);try{const result=await offer.submit(name);if(result!=='rejected')setOffer(null);}catch(error){setMessage(error instanceof Error?error.message:'Could not submit this run.');}finally{setBusy(false);}}
 useEffect(()=>{const update=(event:Event)=>{const detail=(event as CustomEvent<unknown>).detail;if(typeof detail==='string')setMessage(detail);};window.addEventListener('stunts-global-score-status',update);return()=>window.removeEventListener('stunts-global-score-status',update);},[]);
 return <>{offer&&<section className="completed-score-offer"><h3><WebsiteText text={"Submit your completed run"}/></h3><p>{offer.track} · {Math.floor(offer.ticks/1200)}:{String(Math.floor(offer.ticks/20)%60).padStart(2,'0')}.{String((offer.ticks%20)*5).padStart(2,'0')}</p><p><WebsiteText text={"You do not need to beat the in-game top seven. Submitting publishes your replay for verification; only qualifying times rank, and slower verified attempts appear in recent runs."}/></p><form onSubmit={event=>{event.preventDefault();void submit();}}><label><WebsiteText text={"Driver name"}/><input value={name} maxLength={16} required onChange={event=>setName(event.target.value)} autoComplete="nickname"/></label><button type="submit" disabled={busy||!name.trim()}><WebsiteText text={"Submit score and replay"}/></button><button type="button" disabled={busy} onClick={()=>setOffer(null)}><WebsiteText text={"Keep private"}/></button></form></section>}<p className="global-score-status" role="status" aria-live="polite"><WebsiteText text={message}/></p></>;
}
