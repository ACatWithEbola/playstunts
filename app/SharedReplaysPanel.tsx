'use client';
import ReplayDownload from './ReplayDownload';
import {WebsiteText} from '@/app/WebsiteLanguage';
import {useEffect,useState,useRef,useCallback} from 'react';
import ListPagination from './ListPagination';
import {openNativeFilePersistence} from '@/lib/game/native-file-store';
import {NATIVE_GAME_DIRECTORY_KEY} from '@/lib/game/browser-setup-selection';
import {MAX_RANKED_FRAMES} from '@/lib/game/global-score-format';
import {validateReplayEncoding} from '@/lib/game/upload-validation';
import {prepareSharedReplayImport} from '@/lib/game/shared-replay-import';
type Replay={id:string;track:string;car:string;ticks:number;driver:string;trackName:string};
const time=(ticks:number)=>`${Math.floor(ticks/1200)}:${(Math.floor(ticks/20)%60).toString().padStart(2,'0')}.${((ticks%20)*5).toString().padStart(2,'0')}`;
export default function SharedReplaysPanel({running}:{running:boolean}){
 const [replays,setReplays]=useState<Replay[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false);
 const [track,setTrack]=useState(''),[car,setCar]=useState(''),[sort,setSort]=useState('fastest'),[page,setPage]=useState(0),[hasMore,setHasMore]=useState(false),[tracks,setTracks]=useState<{hash:string;name:string}[]>([]),[cars,setCars]=useState<{code:string;name:string}[]>([]);
 const [sharedVisible,setSharedVisible]=useState(10);
 async function showMoreShared(){if(sharedVisible>=replays.length){if(await load(true))setSharedVisible(value=>value+10);}else setSharedVisible(value=>value+10);}
 const generation=useRef(0);
 const load=useCallback(async(append=false)=>{const request=++generation.current,nextPage=append?page+1:0;setBusy(true);try{const query=new URLSearchParams({sort,page:String(nextPage)});if(track)query.set('track',track);if(car)query.set('car',car);const response=await fetch('/api/replays?'+query,{cache:'no-store'}),body=await response.json() as {replays:Replay[];tracks:{hash:string;name:string}[];cars:{code:string;name:string}[];hasMore:boolean;error?:string};if(!response.ok)throw Error(body.error);if(request!==generation.current)return;setReplays(previous=>append?[...previous,...body.replays.filter(item=>!previous.some(other=>other.id===item.id))]:body.replays);setTracks(body.tracks);setCars(body.cars);setHasMore(body.hasMore);setPage(nextPage);setLoaded(true);if(!append)setSharedVisible(10);return true;}catch(error){if(request===generation.current)setMessage(error instanceof Error?error.message:'Could not load replays');return false;}finally{if(request===generation.current)setBusy(false);}},[track,car,sort,page]);
 useEffect(()=>{const update=()=>{if(loaded)void load();};window.addEventListener('stunts-public-replay-shared',update);return()=>window.removeEventListener('stunts-public-replay-shared',update);},[loaded,load]);
 useEffect(()=>{if(loaded)void load();},[track,car,sort]);
 async function add(replay:Replay){setBusy(true);try{const response=await fetch('/api/replays?id='+replay.id);if(!response.ok)throw Error('Replay is no longer available');const bytes=new Uint8Array(await response.arrayBuffer());validateReplayEncoding(bytes,MAX_RANKED_FRAMES);const directory=localStorage.getItem(NATIVE_GAME_DIRECTORY_KEY)??'C:\\',db=await openNativeFilePersistence();let replayName='';try{const prepared=prepareSharedReplayImport(bytes,replay.id,directory,await db.all());replayName=prepared.replayName;await db.merge(prepared.files);}finally{db.close?.();}setMessage(`${replayName} added. Press Play, then Options → Load Replay and select ${replayName}.`);}catch(error){setMessage(error instanceof Error?error.message:'Could not add replay');}finally{setBusy(false);}}
 return <details className="shared-tracks replay-library" onToggle={event=>{if(event.currentTarget.open&&!loaded&&!busy)void load();}}>
 <summary><WebsiteText text="High-score replays"/></summary>
 <p><WebsiteText text="Submitting a high score also publishes its verified replay. Skip submission to keep the run private. Older private recordings are not published automatically."/></p>
 <button disabled={busy} onClick={()=>void load()}><WebsiteText text="Refresh replays"/></button><output aria-live="polite"><WebsiteText text={message}/></output>
 <h3><WebsiteText text="Shared runs"/></h3>
 <div className="replay-filters">
 <label><WebsiteText text="Track"/><select value={track} onChange={event=>setTrack(event.target.value)}><option value=""><WebsiteText text="All tracks"/></option>{tracks.map(item=><option key={item.hash} value={item.hash}>{item.name}</option>)}</select></label>
 <label><WebsiteText text="Car"/><select value={car} onChange={event=>setCar(event.target.value)}><option value=""><WebsiteText text="All cars"/></option>{cars.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}</select></label>
 <label><WebsiteText text="Sort replays"/><select value={sort} onChange={event=>setSort(event.target.value)}><option value="fastest"><WebsiteText text="Fastest first"/></option><option value="newest"><WebsiteText text="Most recent"/></option></select></label>
 </div>
 {loaded&&!replays.length&&<p><WebsiteText text="No replays match these filters."/></p>}
 {!!replays.length&&<div className="replay-table-wrap"><table className="replay-table"><thead><tr><th><WebsiteText text="Driver"/></th><th><WebsiteText text="Track"/></th><th><WebsiteText text="Car"/></th><th><WebsiteText text="Time"/></th><th><WebsiteText text="Actions"/></th></tr></thead><tbody>{replays.slice(0,sharedVisible).map(replay=><tr key={replay.id}><td>{replay.driver}</td><td>{replay.trackName}</td><td>{replay.car}</td><td className="replay-time">{time(replay.ticks)}</td><td><div className="replay-actions"><button disabled={busy||running} onClick={()=>void add(replay)}><WebsiteText text="Add replay to my game"/></button><ReplayDownload id={replay.id} label="Download .RPL"/></div></td></tr>)}</tbody></table></div>}
 <ListPagination visible={sharedVisible} total={replays.length} hasMore={hasMore} busy={busy} onMore={()=>void showMoreShared()} onReset={()=>setSharedVisible(10)}/>
 {running&&<p><WebsiteText text="Save your current run and restart the webpage game before adding a shared replay. Playback uses the original replay viewer and its camera controls."/></p>}
 <p><WebsiteText text="Filter shared replays by track and car, then sort by fastest time or most recent. Use Show 10 more to browse beyond the first ten. Ranked replays and each driver’s five most recent verified runs per track are retained. Your private in-game replays are not deleted."/></p>
 </details>;
}
