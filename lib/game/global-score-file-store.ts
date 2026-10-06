import type {createNativeFileStore} from './native-file-store.ts';
import type {createGlobalScoreClient} from './browser-global-scores.ts';
import type {createNativeManualRaceRuntime} from './native-manual-race-runtime.ts';
import type {NativeRaceResultsState} from './native-race-results.ts';
import type {captureGlobalRace} from './global-race-recording.ts';
import {GLOBAL_SCORE_RULES,sharedScoreFile} from './global-score-format.ts';
import type {RouteAssessment} from '../server/shortcut-assessment.ts';
export type GlobalScoreContext={runtime:Awaited<ReturnType<typeof createNativeManualRaceRuntime>>;state:NativeRaceResultsState;history:ReturnType<typeof captureGlobalRace>|undefined};
/** Swap only high-score disk services. The original menus and record insertion
 * run unchanged; personal game files keep using their existing private drive. */
export function createGlobalScoreFileStore(local:Awaited<ReturnType<typeof createNativeFileStore>>,shared:Awaited<ReturnType<typeof createGlobalScoreClient>>,context:()=>GlobalScoreContext|undefined){
 const scoreName=(name:string,extension:string)=>(name+extension).replace(/\.hig$/i,''),isScore=(name:string,extension:string)=>/\.hig$/i.test(name+extension);
 const assessed=new WeakMap<GlobalScoreContext,Promise<RouteAssessment|undefined>>();
 return {...local,
  close(){local.close();shared.close();},
  exists(path:string,name:string,extension:string){return isScore(name,extension)?local.exists(path,scoreName(name,extension),'.trk'):local.exists(path,name,extension);},
  async read(path:string,name:string,extension:string){
   if(!isScore(name,extension))return local.read(path,name,extension);
   const current=context(),car=current?String.fromCharCode(...current.runtime.session.state.memory.slice(0x2d1a0+0x8fc2,0x2d1a0+0x8fc6)):undefined;
   const track=await local.read(path,scoreName(name,extension),'.trk');
   // Qualify against this run's server-assessed category, so faster exploits
   // cannot prevent a slower full-route driver from entering their name.
   if(current&&current.history&&!current.history.continued&&current.state.panel.playerTime&&current.runtime.session.state.memory[0x2d1a0+0x8018]===1){
    let assessment=assessed.get(current);if(!assessment){const history=current.history,m=current.runtime.session.state.memory,d=0x2d1a0,replay=new Uint8Array(0x722+history.inputs.length),record=Array(52).fill(0),ticks=current.state.panel.playerTime;
     record[50]=ticks&255;record[51]=ticks>>>8;replay.set(m.slice(d+0x8fc2,d+0x8fc2+24));replay.set(track,24);replay.set(history.inputs,0x722);new DataView(replay.buffer).setUint16(22,history.inputs.length,true);
     assessment=shared.assess({record,replay:Array.from(replay),continued:false,flags:1,rules:GLOBAL_SCORE_RULES});assessed.set(current,assessment);
    }
    const category=await assessment;
    // An offline name entry may queue a proof, but only the server can place
    // it into a category after reconnection. It creates no unverified score.
    return category?shared.read(track,car,category):sharedScoreFile([]);
   }
   return shared.read(track,car);
  },
  async write(path:string,name:string,extension:string,bytes:Uint8Array){
   if(!isScore(name,extension))return local.write(path,name,extension,bytes);
   const current=context();if(!current)return;
   const record=Array.from(current.state.scores.retainedRecord);
   if(!Array.from({length:7},(_,i)=>bytes.slice(i*52,i*52+52)).some(row=>row.length===52&&row.every((n,i)=>n===record[i])))return;
   const session=current.runtime.session,m=session.state.memory,d=0x2d1a0,history=current.history;
   if(!history||history.continued||m[d+0x8018]!==1)return;
   await session.saveReplay(async replay=>{const complete=new Uint8Array(0x722+history.inputs.length);complete.set(replay.slice(0,0x722));complete.set(history.inputs,0x722);new DataView(complete.buffer).setUint16(22,history.inputs.length,true);await shared.submit({record,replay:Array.from(complete),continued:false,flags:m[d+0x8018],rules:GLOBAL_SCORE_RULES});return 0;});
  },
 };
}
