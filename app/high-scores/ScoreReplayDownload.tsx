'use client';
import {useState,type ComponentProps} from 'react';
import ReplayDownload from '../ReplayDownload';
import {WebsiteText} from '../WebsiteLanguage';
import {validateReplayEncoding} from '@/lib/game/upload-validation';
import {prepareSharedReplayImport} from '@/lib/game/shared-replay-import';
import {openNativeFilePersistence} from '@/lib/game/native-file-store';
import {NATIVE_GAME_DIRECTORY_KEY} from '@/lib/game/browser-setup-selection';
import {resolvePhysicsEngine} from '@/lib/physics/engine-version';
export default function ScoreReplayDownload(props:ComponentProps<typeof ReplayDownload>){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function add(){
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/replays?format=canonical&id='+encodeURIComponent(props.id),{cache:'no-store'});
   if(!response.ok)throw Error('Replay is no longer available');
   const bytes=new Uint8Array(await response.arrayBuffer());validateReplayEncoding(bytes);
   const engine=resolvePhysicsEngine(response.headers.get('X-Stunts-Physics-Engine'));
   const db=await openNativeFilePersistence();
   try{
    const existing=await db.all();
    const prepared=prepareSharedReplayImport(bytes,props.id,localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY)??'C:\\',existing,engine);
    await db.merge(prepared.files,existing);
    setMessage(`${prepared.replayName} added. Press Play, then Options → Load Replay and select ${prepared.replayName}.`);
   }finally{db.close?.();}
  }catch(e){setMessage(e instanceof Error?e.message:'Could not add replay');}
  finally{setBusy(false);}
 }
 if(props.className!=='scores-replay-dot')return <ReplayDownload {...props}/>;
 return <div className="scores-replay-actions"><button type="button" className="scores-replay-add" disabled={busy} onClick={()=>void add()}><WebsiteText text="Add replay to my game"/></button><span className="scores-replay-divider" aria-hidden="true">|</span><ReplayDownload {...props}/>{message&&<output role="status"><WebsiteText text={message}/></output>}</div>;
}
