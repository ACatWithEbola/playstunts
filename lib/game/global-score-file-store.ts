import type {createNativeFileStore} from './native-file-store.ts';
import type {createGlobalScoreClient} from './browser-global-scores.ts';
import type {createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import type {NativeRaceResultsState} from './native-race-results.ts';
import type {captureGlobalRace} from './global-race-recording.ts';
import {sharedScoreFile,scoreTicks} from './global-score-format.ts';
export type GlobalScoreContext={runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;state:NativeRaceResultsState;history:ReturnType<typeof captureGlobalRace>|undefined};
/** Preserve the original private seven-slot disk table and record insertion.
 * Public submission is separate; server rankings never replace local scores. */
export function createGlobalScoreFileStore(local:Awaited<ReturnType<typeof createNativeFileStore>>,shared:Awaited<ReturnType<typeof createGlobalScoreClient>>,context:()=>GlobalScoreContext|undefined){
 const scoreName=(name:string,extension:string)=>(name+extension).replace(/\.hig$/i,''),isScore=(name:string,extension:string)=>/\.hig$/i.test(name+extension);
 return {...local,
  close(){local.close();shared.close();},
  exists(path:string,name:string,extension:string){return isScore(name,extension)?local.exists(path,scoreName(name,extension),'.trk'):local.exists(path,name,extension);},
  async read(path:string,name:string,extension:string){
   if(!isScore(name,extension))return local.read(path,name,extension);
   const track=await local.read(path,scoreName(name,extension),'.trk');
   const original=local.exists(path,name,extension)?await local.read(path,name,extension):sharedScoreFile([]);
   const records=Array.from({length:7},(_,i)=>Array.from(original.slice(i*52,i*52+52))).filter(r=>r.length===52&&scoreTicks(r)!==65535);
   const seen=new Set(records.map(r=>JSON.stringify(r)));
   for(const record of await shared.retainedRecords(track)){const key=JSON.stringify(record);if(!seen.has(key)){seen.add(key);records.push(record);}}
   records.sort((a,b)=>scoreTicks(a)-scoreTicks(b));
   const restored=sharedScoreFile(records);
   if(!original.every((value,index)=>value===restored[index]))await local.write(path,name,extension,restored);
   return restored;
  },
  async write(path:string,name:string,extension:string,bytes:Uint8Array){
   if(!isScore(name,extension))return local.write(path,name,extension,bytes);
   // The original name-entry flow only saves privately. All public submissions
   // now require the completed-run panel, including top-seven finishes.
   await local.write(path,name,extension,bytes);
  },
 };
}
