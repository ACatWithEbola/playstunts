'use client';
import {useEffect,useState} from 'react';
export default function GlobalScoreStatus(){
 const [message,setMessage]=useState('');
 useEffect(()=>{const update=(event:Event)=>{const detail=(event as CustomEvent<unknown>).detail;if(typeof detail==='string')setMessage(detail);};window.addEventListener('stunts-global-score-status',update);return()=>window.removeEventListener('stunts-global-score-status',update);},[]);
 return <p className="global-score-status" role="status" aria-live="polite">{message}</p>;
}
