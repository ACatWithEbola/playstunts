'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {WebsiteText} from './WebsiteLanguage';
import {replayCompatibilityLabel} from '../lib/game/replay-compatibility-label';

export const replayCompatibility='PlayStunts replays target Mindscape’s 4D Sports Driving v1.1, released 13 December 1990 (MS 1990). Our test replay finished correctly in that DOS version. Other DOS releases may play the same inputs differently and are not supported for matching playback. Chocolate Stunts matched our test with left-corner bias disabled (--lcb:off); compatibility with every replay is not guaranteed.';

export default function ReplayDownload({id,label='Download replay',className}:{id:string;label?:string;className?:string}){
 const dialog=useRef<HTMLDialogElement>(null),title=useId();
 const [mounted,setMounted]=useState(false);
 const [message,setMessage]=useState('');
 useEffect(()=>{setMounted(true);},[]);
 const [compatibility,setCompatibility]=useState('Compatible with Mindscape’s 4D Sports Driving v1.1 — 13 December 1990 (MS 1990).');
 const href='/api/replays?id='+encodeURIComponent(id);
return <>{message&&<output role="status"><WebsiteText text={message}/></output>}<a href={href} className={['replay-download-link',className].filter(Boolean).join(' ')} onClick={async event=>{
 event.preventDefault();
 setMessage('');
 const anchor=event.currentTarget.getBoundingClientRect();
 try{
  const response=await fetch(href+'&format=metadata',{cache:'no-store'});
  if(!response.ok)throw Error('Replay is no longer available');
  const value:unknown=await response.json();
  if(!value||typeof value!=='object')throw Error('Replay is no longer available');
  setCompatibility(replayCompatibilityLabel((value as {physicsEngine?:unknown}).physicsEngine));
 }catch{setMessage('Replay is no longer available');return;}
 const panel=dialog.current;if(!panel||panel.open)return;
 panel.showModal();
 const box=panel.getBoundingClientRect();
 panel.style.left=Math.max(16,Math.min(window.innerWidth-box.width-16,anchor.left-box.width-16))+'px';
 panel.style.top=Math.max(16,Math.min(window.innerHeight-box.height-16,anchor.top-box.height/2))+'px';
}}><WebsiteText text={label}/></a>{mounted&&createPortal(<dialog ref={dialog} className="saved-file-dialog replay-compatibility-dialog" aria-labelledby={title}><h2 id={title}><WebsiteText text="Replay compatibility"/></h2><p><WebsiteText text={compatibility}/></p><div className="replay-compatibility-actions"><button onClick={()=>{dialog.current?.close();const link=document.createElement('a');link.href=href;link.download='';document.body.appendChild(link);link.click();link.remove();}}><WebsiteText text="OK"/></button><button onClick={()=>dialog.current?.close()}><WebsiteText text="Cancel"/></button></div></dialog>,document.body)}</>;
}
