'use client';
import {useId,useRef} from 'react';
import {createPortal} from 'react-dom';
import {WebsiteText} from './WebsiteLanguage';

export const replayCompatibility='PlayStunts replays target Mindscape’s 4D Sports Driving v1.1, released 13 December 1990 (MS 1990). Our test replay finished correctly in that DOS version. Other DOS releases may play the same inputs differently and are not supported for matching playback. Chocolate Stunts matched our test with left-corner bias disabled (--lcb:off); compatibility with every replay is not guaranteed.';

export default function ReplayDownload({id,label='Download replay',className}:{id:string;label?:string;className?:string}){
 const dialog=useRef<HTMLDialogElement>(null),title=useId();
 const href='/api/replays?id='+encodeURIComponent(id);
 return <><a href={href} className={className} onClick={event=>{event.preventDefault();dialog.current?.showModal();}}><WebsiteText text={label}/></a>{typeof document!=='undefined'&&createPortal(<dialog ref={dialog} className="saved-file-dialog replay-compatibility-dialog" aria-labelledby={title}><h2 id={title}><WebsiteText text="Replay compatibility"/></h2><p><WebsiteText text={replayCompatibility}/></p><button onClick={()=>{dialog.current?.close();const link=document.createElement('a');link.href=href;link.download='';document.body.appendChild(link);link.click();link.remove();}}><WebsiteText text="OK"/></button><button onClick={()=>dialog.current?.close()}><WebsiteText text="Cancel"/></button></dialog>,document.body)}</>;
}
