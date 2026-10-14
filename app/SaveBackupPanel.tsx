'use client';
import {WebsiteText,WebsiteElement} from '@/app/WebsiteLanguage';
import {bundledTrackReplays} from '@/lib/game/bundled-track-replays';
import type {Assets} from '@/lib/game/types';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import ListPagination from './ListPagination';
import {preparePrivateReplayUpload} from '@/lib/game/replay-upload';
import {replayTrackImport} from '@/lib/game/replay-track-import';
import {detectReplayVersions} from '@/lib/game/replay-version-detection';
import {nativeFileDownload} from '@/lib/game/native-file-download';
import {effectiveNativeDownloads} from '@/lib/game/native-download-catalog';
import {replayCompatibilityLabel} from '@/lib/game/replay-compatibility-label';
import {resolvePhysicsEngine,type PhysicsEngineVersion} from '@/lib/physics/engine-version';
import {prepareTrackUpload} from '@/lib/game/track-upload';
import {type NativeStoredFile,openNativeFilePersistence} from '@/lib/game/native-file-store';
import {NATIVE_GAME_DIRECTORY_KEY} from '@/lib/game/browser-setup-selection';
import {encodeSaveBackup,decodeSaveBackup} from '@/lib/game/save-backup';
export default function SaveBackupPanel({running,assets}:{running:boolean;assets:Assets|null}){
 const dialog=useRef<HTMLDialogElement>(null),[downloads,setDownloads]=useState<NativeStoredFile[]>([]);
 const [visible,setVisible]=useState(10);
 const [mounted,setMounted]=useState(false);
 const trackConflictDialog=useRef<HTMLDialogElement>(null),trackConflictChoice=useRef<((value:boolean)=>void)|null>(null);
 const [trackConflictName,setTrackConflictName]=useState('');
 const finishTrackConflict=(value:boolean)=>{trackConflictDialog.current?.close();const resolve=trackConflictChoice.current;trackConflictChoice.current=null;resolve?.(value);};
 useEffect(()=>()=>{trackConflictChoice.current?.(false);trackConflictChoice.current=null;},[]);
 useEffect(()=>{setMounted(true);},[]);
 const downloadDialog=useRef<HTMLDialogElement>(null);
 const [pendingDownload,setPendingDownload]=useState<NativeStoredFile|null>(null);
 const [downloadCompatibility,setDownloadCompatibility]=useState('');
 function requestDownload(file:NativeStoredFile,anchor:DOMRect){
  if(!/\.RPL$/i.test(file.key)){downloadFile(file);return;}
  try{setDownloadCompatibility(replayCompatibilityLabel(resolvePhysicsEngine(file.physicsEngine)));setPendingDownload(file);
   const panel=downloadDialog.current;if(!panel||panel.open)return;panel.showModal();
   const box=panel.getBoundingClientRect();
   panel.style.left=Math.max(16,Math.min(window.innerWidth-box.width-16,anchor.left-box.width-16))+'px';
   panel.style.top=Math.max(16,Math.min(window.innerHeight-box.height-16,anchor.top-box.height/2))+'px';
  }catch(e){setMessage(e instanceof Error?e.message:'Could not load saved files.');}
 }
 const importDialog=useRef<HTMLDialogElement>(null),pendingReplay=useRef<File|null>(null);
 const [importEngine,setImportEngine]=useState<PhysicsEngineVersion>('ms-1990');
 const [importCandidates,setImportCandidates]=useState<PhysicsEngineVersion[]>([]);
 async function chooseReplayVersion(file:File){
  setBusy(true);
  try{
   if(file.size>0x724+65535)throw Error('Replay file is too large.');
   const candidates=detectReplayVersions(new Uint8Array(await file.arrayBuffer()));
   if(!candidates.length)throw Error('This is not a supported original Stunts replay');
   if(candidates.length===1){await uploadReplay(file,candidates[0]);return;}
   pendingReplay.current=file;setImportCandidates(candidates);setImportEngine(candidates[0]);importDialog.current?.showModal();
  }catch(e){setMessage(e instanceof Error?e.message:'Replay upload failed.');if(replayInput.current)replayInput.current.value='';}
  finally{setBusy(false);}
 }
 async function showDownloads(){setVisible(10);setBusy(true);try{const db=await openNativeFilePersistence();try{if(!assets)throw Error('Game files are still loading. Please try again.');const bundled=bundledTrackReplays(assets.tracks,async path=>{const response=await fetch('/game/'+path);if(!response.ok)throw Error('Could not load '+path);return new Uint8Array(await response.arrayBuffer());},assets.replays);const files=await Promise.all([...bundled].map(async([key,load])=>({key,bytes:await load()})));setDownloads(effectiveNativeDownloads(files,await db.all()));}finally{db.close?.();}dialog.current?.showModal();}catch(e){setMessage(e instanceof Error?e.message:'Could not load saved files.');}finally{setBusy(false);}}
 function downloadFile(file:NativeStoredFile){try{const name=file.key.split(/[\\/]/).pop()!,url=URL.createObjectURL(new Blob([new Uint8Array(nativeFileDownload(file))],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage(`${name} downloaded.`);}catch(e){setMessage(e instanceof Error?e.message:'Could not load saved files.');}}
 const replayInput=useRef<HTMLInputElement>(null),trackInput=useRef<HTMLInputElement>(null),input=useRef<HTMLInputElement>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function backup(){setBusy(true);try{const db=await openNativeFilePersistence();let files;try{files=await db.all();}finally{db.close?.();}const text=encodeSaveBackup(files,localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY)??'C:\\'),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='stunts-saves-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage(`Backup downloaded: ${files.length} saved files.`);}catch(e){setMessage(e instanceof Error?e.message:'Backup failed.');}finally{setBusy(false);}}
 async function restore(file:File){setBusy(true);try{if(file.size>32*1024*1024)throw Error('Backup is too large (maximum 32 MB).');const backup=decodeSaveBackup(await file.text()),db=await openNativeFilePersistence();let count;try{count=await db.merge(backup.files);}finally{db.close?.();}if(!localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY))localStorage.setItem(NATIVE_GAME_DIRECTORY_KEY,backup.directory);setMessage(`Imported ${count} files. Existing files were kept. Reload the page before playing.`);}catch(e){setMessage(e instanceof Error?e.message:'Import failed.');}finally{setBusy(false);if(input.current)input.current.value='';}}
 async function uploadTrack(file:File){setBusy(true);try{if(file.size!==1802)throw Error('Original Stunts .TRK files must be exactly 1,802 bytes.');const track=prepareTrackUpload(file.name,new Uint8Array(await file.arrayBuffer()),localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY)??'C:\\'),db=await openNativeFilePersistence();let count;try{count=await db.merge([track]);}finally{db.close?.();}setMessage(count?`Track ${file.name.toUpperCase()} imported. Press Play, then open Track and load it from the game’s track menu.`:'A track with that name already exists. Rename your file to import another copy.');}catch(e){setMessage(e instanceof Error?e.message:'Track upload failed.');}finally{setBusy(false);if(trackInput.current)trackInput.current.value='';}}
 async function uploadReplay(file:File,engine:PhysicsEngineVersion){
  setBusy(true);
  try{
   if(!assets)throw Error('Game files are still loading. Please try again.');
   const replay=preparePrivateReplayUpload(file.name,new Uint8Array(await file.arrayBuffer()),localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY)??'C:\\\\',engine);
   const plan=replayTrackImport(replay),bundled=bundledTrackReplays(assets.tracks,async path=>{const response=await fetch('/game/'+path);if(!response.ok)throw Error('Could not load '+path);return new Uint8Array(await response.arrayBuffer());},assets.replays);
   const existing=plan.track&&bundled.has(plan.track.key)?await bundled.get(plan.track.key)!():undefined;
   const db=await openNativeFilePersistence();
   try{
    let result=await db.importReplay(replay,existing);
    if(result.status==='conflict'||result.status==='unsupported-name'){
     setTrackConflictName(result.trackName);
     const proceed=await new Promise<boolean>(resolve=>{trackConflictChoice.current=resolve;trackConflictDialog.current?.showModal();});
     if(!proceed)return;
     result=await db.importReplay(replay,existing,true);
    }
    setMessage(result.status==='duplicate'?'A replay with that name already exists. Rename your file to import another copy.':result.trackAdded?'Replay and matching track imported. Both files stay private in this browser.':`Replay ${file.name.toUpperCase()} imported. Press Play, then open the replay menu and load it.`);
   }finally{db.close?.();}
  }catch(e){setMessage(e instanceof Error?e.message:'Replay upload failed.');}
  finally{setBusy(false);if(replayInput.current)replayInput.current.value='';}
 }
 const trackConflictPanel=mounted&&createPortal(
  <dialog ref={trackConflictDialog} className="saved-file-dialog replay-compatibility-dialog replay-track-conflict-dialog" aria-labelledby="replay-track-conflict" onCancel={event=>{event.preventDefault();finishTrackConflict(false);}}>
   <h2 id="replay-track-conflict"><WebsiteText text="Replay track unavailable"/></h2>
   <p><code>{trackConflictName}</code></p>
   <p><WebsiteText text="The matching track cannot be added safely: its name is unsupported or a different track already uses it. Your existing files will not be replaced. You can import the replay without adding its track."/></p>
   <div className="replay-compatibility-actions">
    <button onClick={()=>finishTrackConflict(true)}><WebsiteText text="Import replay only"/></button>
    <button onClick={()=>finishTrackConflict(false)}><WebsiteText text="Cancel"/></button>
   </div>
  </dialog>,document.body);
return <details id="saves">{trackConflictPanel}<summary><WebsiteText text={"Tracks, replays and save backups"}/></summary><p className="private-saves-note"><strong><WebsiteText text={"Private — only in this browser"}/></strong><br/><WebsiteText text={"Files imported here are for your own game. They are not shared with other players or synced between devices. Clearing browser data can erase them; download a backup to keep a copy."}/></p><p><WebsiteText text={"Upload an original "}/><strong><WebsiteText text={".TRK"}/></strong><WebsiteText text={" track (1,802 bytes) or "}/><strong><WebsiteText text={".RPL"}/></strong><WebsiteText text={" replay, then load it from the game’s track or replay menu. Files stay in this browser."}/></p><p><WebsiteText text={"Want everyone to play your track? Open "}/><a href="#community-tracks"><WebsiteText text={"Community tracks"}/></a><WebsiteText text={" and choose Share track (.TRK)."}/></p><button onClick={()=>trackInput.current?.click()} disabled={busy||running}><WebsiteText text={"Upload track (.TRK)"}/></button><input ref={trackInput} type="file" accept=".trk" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void uploadTrack(f);}}/>{<WebsiteText text={' '}/>}<button onClick={()=>replayInput.current?.click()} disabled={busy||running}><WebsiteText text={"Upload replay (.RPL)"}/></button><input ref={replayInput} type="file" accept=".rpl" hidden onChange={e=>{const f=e.target.files?.[0];if(f)chooseReplayVersion(f);}}/>{<WebsiteText text={' '}/>}<button onClick={()=>void showDownloads()} disabled={busy}><WebsiteText text={"Download tracks & replays"}/></button>{<WebsiteText text={' '}/>}<button onClick={backup} disabled={busy}><WebsiteText text={"Download backup"}/></button>{<WebsiteText text={' '}/>}<button onClick={()=>input.current?.click()} disabled={busy||running}><WebsiteText text={"Import backup"}/></button><input ref={input} type="file" accept=".json,application/json" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void restore(f);}}/>{running&&<p><WebsiteText text={"To import, reload this page and import before pressing Play. Save your current run first."}/></p>}<output>{<WebsiteText text={message}/>}</output><dialog ref={dialog} className="saved-file-dialog" aria-labelledby="saved-file-title"><div className="saved-file-heading"><h2 id="saved-file-title"><WebsiteText text={"Download tracks & replays"}/></h2><WebsiteElement as="button" onClick={()=>dialog.current?.close()} aria-label="Close downloads"><WebsiteText text={"Close"}/></WebsiteElement></div><p><WebsiteText text={"Includes bundled tracks and replays plus files you saved or uploaded. Saved versions replace bundled files with the same path and name. Download .TRK and .RPL files directly into your DOS Stunts folder. Save new tracks or runs in the game before downloading."}/></p>{downloads.length?<ul className="saved-file-list">{downloads.slice(0,visible).map(file=><li key={file.key}><span><strong>{file.key.split(/[\\/]/).pop()}</strong><small>{file.key} · {file.bytes.length.toLocaleString()}<WebsiteText text={" bytes"}/></small></span><WebsiteElement as="button" onClick={event=>requestDownload(file,event.currentTarget.getBoundingClientRect())} aria-label={`Download ${file.key}`}><WebsiteText text={"Download"}/></WebsiteElement></li>)}</ul>:<p><WebsiteText text={"No saved tracks or replays yet. Save one in the game, then reopen this window."}/></p>}<ListPagination visible={visible} total={downloads.length} onMore={()=>setVisible(value=>value+10)} onReset={()=>setVisible(10)}/><output>{<WebsiteText text={message}/>}</output></dialog><dialog ref={importDialog} className="saved-file-dialog" aria-labelledby="replay-import-title" onCancel={()=>{pendingReplay.current=null;if(replayInput.current)replayInput.current.value='';}}><h2 id="replay-import-title"><WebsiteText text={"Game version"}/></h2><p><WebsiteText text={"Choose the version that recorded this replay. This does not convert its physics."}/></p><label><WebsiteText text={"Game version"}/><select value={importEngine} onChange={e=>setImportEngine(resolvePhysicsEngine(e.target.value))}>{importCandidates.map(engine=><option key={engine} value={engine}><WebsiteText text={engine==='ms-1990'?'Mindscape 1990 (legacy)':engine==='ms-1991'?'Mindscape 1991':'Brøderbund 1991'}/></option>)}</select></label><p><button disabled={busy} onClick={()=>{const file=pendingReplay.current;if(file&&importCandidates.includes(importEngine)){importDialog.current?.close();pendingReplay.current=null;void uploadReplay(file,importEngine);}}}><WebsiteText text={"OK"}/></button>{' '}<button onClick={()=>{pendingReplay.current=null;if(replayInput.current)replayInput.current.value='';importDialog.current?.close();}}><WebsiteText text={"Cancel"}/></button></p></dialog>{mounted&&createPortal(<dialog ref={downloadDialog} className="saved-file-dialog replay-compatibility-dialog" aria-labelledby="private-replay-compatibility"><h2 id="private-replay-compatibility"><WebsiteText text={"Replay compatibility"}/></h2><p><WebsiteText text={downloadCompatibility}/></p>{pendingDownload?.framesPerSecond===10&&<p><WebsiteText text="This is a private slow-mode replay: 10 updates per second. Downloading preserves its recorded rate; it cannot be submitted to public high scores."/></p>}<div className="replay-compatibility-actions"><button onClick={()=>{downloadDialog.current?.close();if(pendingDownload)downloadFile(pendingDownload);setPendingDownload(null);}}><WebsiteText text={"OK"}/></button><button onClick={()=>{downloadDialog.current?.close();setPendingDownload(null);}}><WebsiteText text={"Cancel"}/></button></div></dialog>,document.body)}</details>;
}
