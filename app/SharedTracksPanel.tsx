'use client';
import {useRef,useState} from 'react';
import {prepareTrackUpload} from '@/lib/game/track-upload';
import {openNativeFilePersistence} from '@/lib/game/native-file-store';
import {NATIVE_GAME_DIRECTORY_KEY} from '@/lib/game/browser-setup-selection';
type Track={hash:string;name:string;created_at:number};
export default function SharedTracksPanel({running}:{running:boolean}){
 const [tracks,setTracks]=useState<Track[]>([]),[next,setNext]=useState<string|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false);
 const fileInput=useRef<HTMLInputElement>(null);
 async function load(more=false){setBusy(true);try{const response=await fetch('/api/tracks'+(more&&next?'?before='+encodeURIComponent(next):''),{cache:'no-store'}),body=await response.json() as {tracks:Track[];next:string|null;error?:string};if(!response.ok)throw Error(body.error);setTracks(before=>more?[...before,...body.tracks]:body.tracks);setNext(body.next);setLoaded(true);}catch(error){setMessage(error instanceof Error?error.message:'Could not load tracks');}finally{setBusy(false);}}
 async function share(file:File){setBusy(true);try{
  if(file.size!==1802)throw Error('Choose an original .TRK file (1,802 bytes).');
  const prepared=prepareTrackUpload(file.name,new Uint8Array(await file.arrayBuffer()),'C:\\'),name=prepared.key.split('\\').pop()!.replace(/\.TRK$/,'');
  const response=await fetch('/api/tracks',{method:'POST',headers:{'Content-Type':'application/json','X-Stunts-Track':'share'},body:JSON.stringify({name,bytes:Array.from(prepared.bytes)})}),body=await response.json() as {error?:string};
  if(!response.ok)throw Error(body.error);setMessage(`${name} is shared with everyone. Identical tracks share one listing and leaderboard.`);await load();
 }catch(error){setMessage(error instanceof Error?error.message:'Could not share track');}finally{setBusy(false);if(fileInput.current)fileInput.current.value='';}}
 async function add(track:Track){setBusy(true);try{
  const response=await fetch('/api/tracks?id='+track.hash);if(!response.ok)throw Error('Could not download track');
  const bytes=new Uint8Array(await response.arrayBuffer()),directory=localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY)??'C:\\',db=await openNativeFilePersistence();let added=0,selected=track.name;
  try{const existing=await db.all();let prepared=prepareTrackUpload(selected+'.TRK',bytes,directory);for(let length=3;length<=8;length++){const other=existing.find(file=>file.key===prepared.key);if(!other||other.bytes.length===bytes.length&&other.bytes.every((n,i)=>n===bytes[i]))break;selected=track.name.slice(0,8-length)+track.hash.slice(0,length).toUpperCase();prepared=prepareTrackUpload(selected+'.TRK',bytes,directory);}const other=existing.find(file=>file.key===prepared.key);if(other&&(!other.bytes.every((n,i)=>n===bytes[i])||other.bytes.length!==bytes.length))throw Error('Track filename is already in use. Download and rename the file first.');added=await db.merge([prepared]);}finally{db.close?.();}
  setMessage(added?`${selected} added. Press Play, then Track → Load to select it.`:`${selected} is already in this browser. Existing files were kept.`);
 }catch(error){setMessage(error instanceof Error?error.message:'Could not add track');}finally{setBusy(false);}}
 return <details className="shared-tracks" onToggle={event=>{if(event.currentTarget.open&&!loaded&&!busy)void load();}}><summary>Community tracks</summary><p>Explore tracks shared by other players. Personal imports stay private; <strong>Share track</strong> publishes the selected file for everyone.</p><button disabled={busy} onClick={()=>fileInput.current?.click()}>Share track (.TRK)</button><input type="file" accept=".trk" hidden ref={fileInput} onChange={event=>{const file=event.target.files?.[0];if(file)void share(file);}}/>{' '}<button disabled={busy} onClick={()=>void load()}>Refresh tracks</button><output aria-live="polite">{message}</output>{loaded&&!tracks.length&&<p>No community tracks yet. Share the first one.</p>}<ul>{tracks.map(track=><li key={track.hash}><strong>{track.name}</strong><div><button disabled={busy||running} onClick={()=>void add(track)}>Add to my game</button><a href={'/api/tracks?id='+track.hash} download={track.name+'.TRK'}>Download .TRK</a></div></li>)}</ul>{next&&<button disabled={busy} onClick={()=>void load(true)}>More tracks</button>}{running&&<p>Reload before adding a track to your game. Save your current run first.</p>}</details>;
}
