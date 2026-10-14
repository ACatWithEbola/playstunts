import type {createNativeFileStore} from './native-file-store.ts';
import type {createGlobalScoreClient} from './browser-global-scores.ts';
import type {createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import type {NativeRaceResultsState} from './native-race-results.ts';
import type {captureGlobalRace} from './global-race-recording.ts';
import {sharedScoreFile,scoreTicks} from './global-score-format.ts';
import {LEGACY_PHYSICS,resolvePhysicsEngine,type PhysicsEngineVersion} from '../physics/engine-version.ts';
import {selectBrowserFutureRaceEngine} from './browser-future-race-engine.ts';
import {resolveReplayCadence,type ReplayCadence} from './replay-cadence.ts';
export type GlobalScoreContext={runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;state:NativeRaceResultsState;history:ReturnType<typeof captureGlobalRace>|undefined};
/** Preserve the original private seven-slot disk table and record insertion.
 * Public submission is separate; server rankings never replace local scores. */
export function createGlobalScoreFileStore(local:Awaited<ReturnType<typeof createNativeFileStore>>,shared:Awaited<ReturnType<typeof createGlobalScoreClient>>,context:()=>GlobalScoreContext|undefined,activeEngine:()=>PhysicsEngineVersion=()=>context()?.runtime.session.physicsEngine??selectBrowserFutureRaceEngine(),activeCadence:()=>ReplayCadence=()=>context()?.runtime.session.framesPerSecond??20){
 const scoreName=(name:string,extension:string)=>(name+extension).replace(/\.hig$/i,''),isScore=(name:string,extension:string)=>/\.hig$/i.test(name+extension);
 const scoreTarget=(name:string,extension:string,engine:PhysicsEngineVersion,cadence:ReplayCadence)=>{
  if(engine===LEGACY_PHYSICS){if(cadence!==20)throw Error('Legacy scores require20 Hz');return {name,extension};}
  return {name:scoreName(name,extension),extension:engine==='ms-1991'?(cadence===10?'.M10':'.M91'):(cadence===10?'.B10':'.B91')};
 };
 return {...local,
  close(){local.close();shared.close();},
  exists(path:string,name:string,extension:string){return isScore(name,extension)?local.exists(path,scoreName(name,extension),'.trk'):local.exists(path,name,extension);},
  async read(path:string,name:string,extension:string){
   if(!isScore(name,extension))return local.read(path,name,extension);
   const track=await local.read(path,scoreName(name,extension),'.trk');
   const engine=resolvePhysicsEngine(activeEngine()),cadence=resolveReplayCadence(activeCadence()),target=scoreTarget(name,extension,engine,cadence);
   const original=local.exists(path,target.name,target.extension)?await local.read(path,target.name,target.extension):sharedScoreFile([]);
   // Never silently rebuild or overwrite a damaged retained disk table.
   if(original.length!==7*52)throw Error('Invalid private score table');
   const records=Array.from({length:7},(_,i)=>Array.from(original.slice(i*52,i*52+52))).filter(r=>r.length===52&&scoreTicks(r)!==65535);
   const seen=new Set(records.map(r=>JSON.stringify(r)));
   // Retained public proofs currently use20 Hz only. Their raw tick values
   // must never enter the separate slower-speed private table.
   if(cadence===20)for(const record of await shared.retainedRecords(track,engine)){const key=JSON.stringify(record);if(!seen.has(key)){seen.add(key);records.push(record);}}
   records.sort((a,b)=>scoreTicks(a)-scoreTicks(b));
   const restored=sharedScoreFile(records);
   if(!original.every((value,index)=>value===restored[index]))await local.write(path,target.name,target.extension,restored,engine===LEGACY_PHYSICS?undefined:engine,cadence===10?cadence:undefined);
   return restored;
  },
  async write(path:string,name:string,extension:string,bytes:Uint8Array,physicsEngine?:import('../physics/engine-version.ts').PhysicsEngineVersion,framesPerSecond?:10|20){
   if(!isScore(name,extension))return local.write(path,name,extension,bytes,physicsEngine,framesPerSecond);
   // The original name-entry flow only saves privately. All public submissions
   // now require the completed-run panel, including top-seven finishes.
   const engine=resolvePhysicsEngine(physicsEngine??activeEngine()),cadence=resolveReplayCadence(framesPerSecond??activeCadence()),target=scoreTarget(name,extension,engine,cadence);
   await local.write(path,target.name,target.extension,bytes,engine===LEGACY_PHYSICS?undefined:engine,cadence===10?cadence:undefined);
  },
 };
}
