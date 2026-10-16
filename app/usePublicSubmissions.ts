'use client';
import {useEffect,useState} from 'react';
export type PublicSubmission={id:string;trackHash:string;track:string;driver:string;car:string;ticks:number;physicsEngine:string;state:string;postedAt:number;verifiedId:string|null;error:string};
export function usePublicSubmissions(){
 const [submissions,setSubmissions]=useState<PublicSubmission[]>([]),[error,setError]=useState(false);
 useEffect(()=>{
  let stopped=false,reading=false,processing=false,previous='';const controller=new AbortController();
  const refresh=async()=>{
   if(reading||document.hidden)return;reading=true;
   try{const response=await fetch('/api/score-submissions',{cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(10000)])});if(!response.ok)throw Error('Unavailable');const body=await response.json() as {submissions:PublicSubmission[]};if(stopped)return;
    const fingerprint=JSON.stringify(body.submissions.map(s=>[s.id,s.state]));if(previous&&previous!==fingerprint)window.dispatchEvent(new Event('stunts-score-verification-changed'));previous=fingerprint;setSubmissions(body.submissions);setError(false);
    const next=body.submissions.find(s=>s.state!=='rejected');
    if(next&&!processing){processing=true;void fetch('/api/score-submissions',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Verification':'check'},body:'{}',signal:AbortSignal.timeout(120000)}).then(()=>{if(!stopped){window.dispatchEvent(new Event('stunts-score-verification-changed'));void refresh();}}).catch(()=>{}).finally(()=>{processing=false;});}
   }catch{if(!stopped)setError(true);}finally{reading=false;}
  };
  void refresh();const interval=setInterval(()=>void refresh(),5000),changed=()=>void refresh();
  window.addEventListener('stunts-score-submission-changed',changed);document.addEventListener('visibilitychange',changed);
  return()=>{stopped=true;controller.abort();clearInterval(interval);window.removeEventListener('stunts-score-submission-changed',changed);document.removeEventListener('visibilitychange',changed);};
 },[]);
 return {submissions,error};
}
