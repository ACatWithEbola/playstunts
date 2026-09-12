import {nativeFileKey} from './native-file-store.ts';
import type {Assets} from './types.ts';
/** Shared original file catalogue for the in-game chooser and downloads. */
export function bundledTrackReplays(tracks:Assets['tracks'],binary:(path:string)=>Promise<Uint8Array>){
 const files=new Map<string,()=>Promise<Uint8Array>>(tracks.map(t=>[nativeFileKey('',t.name,'.trk'),async()=>Uint8Array.from(t.raw)]));
 for(const name of ['DEFAULT','CTKFIN','Flaute1'])files.set(nativeFileKey('',name,'.rpl'),()=>binary('replays/'+name+'.RPL'));
 return files;
}
