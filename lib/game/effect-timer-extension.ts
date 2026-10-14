import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** Lossless MS91 timer representation over the retained canonical memory bank.
 * The owner keeps the extra 96 bytes separately; never extend the shared bank
 * in place, where subsequent legacy-layout state is already allocated. */
export function expandEffectTimers(canonical:readonly Uint8Array[],extra:Uint8Array){
 if(canonical.length!==24||canonical.some(t=>t.length!==72)||extra.length!==96)throw Error('Incomplete effect timer extension');
 return canonical.map((timer,index)=>{const full=new Uint8Array(76);full.set(timer);full.set(extra.subarray(index*4,index*4+4),72);return full;});
}
export function splitEffectTimers(full:readonly Uint8Array[]){
 if(full.length!==24||full.some(t=>t.length!==76))throw Error('Incomplete extended effect timer pool');
 const extra=new Uint8Array(96),canonical=full.map((timer,index)=>{extra.set(timer.subarray(72),index*4);return timer.slice(0,72);});
 return {canonical,extra};
}
/** Lifetime belongs to the allocated race adapter, independently of drivers. */
export function createEffectTimerBridge(engine?:PhysicsEngineVersion){
 const extra=new Uint8Array(96);
 return {
  read<T extends {timers:Uint8Array[]}>(state:T):T{return engine==='ms-1991'?{...state,timers:expandEffectTimers(state.timers,extra)}:state;},
  write<T extends {timers:Uint8Array[]}>(state:T,commit:(state:T)=>void){
   if(engine!=='ms-1991'){commit(state);return;}
   const split=splitEffectTimers(state.timers);
   commit({...state,timers:split.canonical});
   extra.set(split.extra); // Retain extensions only after canonical commit succeeds.
  },
 };
}
