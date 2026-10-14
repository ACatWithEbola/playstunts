import {nativeFileKey} from './native-file-store.ts';
import type {Assets} from './types.ts';
import {ORIGINAL_STARTER_TRACKS} from './original-starter-tracks.ts';
import {ms91DemoTrack} from './ms91-demo-track.ts';
/** Shared original file catalogue for the in-game chooser and downloads. */
export function bundledTrackReplays(tracks:Assets['tracks'],binary:(path:string)=>Promise<Uint8Array>,replays?:Assets['replays']){
 const files=new Map<string,()=>Promise<Uint8Array>>(ORIGINAL_STARTER_TRACKS.map(t=>[nativeFileKey('',t.name,'.trk'),async()=>Uint8Array.from(t.raw)]));
 const demoTrack=ms91DemoTrack();files.set(nativeFileKey('',demoTrack.name,'.trk'),async()=>demoTrack.bytes.slice());
 for(const replay of (replays??[{name:'DEFAULT',file:'DEFAULT.RPL',bytes:0,sha256:''}]).filter(r=>r.name.toUpperCase()==='DEFAULT'))files.set(nativeFileKey('',replay.name,'.rpl'),()=>binary('replays/'+replay.file));
 return files;
}
