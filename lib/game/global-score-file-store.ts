import type {createNativeFileStore} from './native-file-store.ts';
import type {createGlobalScoreClient} from './browser-global-scores.ts';
import type {createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import type {NativeRaceResultsState} from './native-race-results.ts';
import type {captureGlobalRace} from './global-race-recording.ts';
import {GLOBAL_SCORE_RULES,sharedScoreFile} from './global-score-format.ts';
export type GlobalScoreContext={runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;state:NativeRaceResultsState;history:ReturnType<typeof captureGlobalRace>|undefined};
/** Swap only high-score disk services. The original menus and record insertion
 * run unchanged; personal game files keep using their existing private drive. */
export function createGlobalScoreFileStore(local:Awaited<ReturnType<typeof createNativeFileStore>>,shared:Awaited<ReturnType<typeof createGlobalScoreClient>>,context:()=>GlobalScoreContext|undefined){
 const scoreName=(name:string,extension:string)=>(name+extension).replace(/\.hig$/i,''),isScore=(name:string,extension:string)=>/\.hig$/i.test(name+extension);
 return {...local,
  close(){local.close();shared.close();},
  exists(path:string,name:string,extension:string){return isScore(name,extension)?local.exists(path,scoreName(name,extension),'.trk'):local.exists(path,name,extension);},
  async read(path:string,name:string,extension:string){
   if(!isScore(name,extension))return local.read(path,name,extension);
   const current=context(),car=current?String.fromCharCode(...current.runtime.session.state.memory.slice(0x2d1a0+0x8fc2,0x2d1a0+0x8fc6)):undefined;
   const track=await local.read(path,scoreName(name,extension),'.trk');
   // Do not upload a replay before explicit name entry and public consent.
   // Offer fresh completed runs; the server ranks them after submission.
   if(current&&current.history&&!current.history.continued&&current.state.panel.playerTime&&current.runtime.session.state.memory[0x2d1a0+0x8018]===1)return sharedScoreFile([]);
   return shared.read(track,car);
  },
  async write(path:string,name:string,extension:string,bytes:Uint8Array){
   if(!isScore(name,extension))return local.write(path,name,extension,bytes);
   const current=context();if(!current)return;
   const record=Array.from(current.state.scores.retainedRecord);
   if(!Array.from({length:7},(_,i)=>bytes.slice(i*52,i*52+52)).some(row=>row.length===52&&row.every((n,i)=>n===record[i])))return;
   const session=current.runtime.session,m=session.state.memory,d=0x2d1a0,history=current.history;
   if(!history||history.continued||m[d+0x8018]!==1)return;
   await session.saveReplay(async replay=>{const complete=new Uint8Array(0x722+history.inputs.length);complete.set(replay.slice(0,0x722));complete.set(history.inputs,0x722);new DataView(complete.buffer).setUint16(22,history.inputs.length,true);await shared.submit({record,replay:Array.from(complete),continued:false,flags:m[d+0x8018],rules:GLOBAL_SCORE_RULES},true);return 0;});
  },
 };
}
