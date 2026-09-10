/** Supplied original update_crash_state (loaded 0xb3b2).
 * Particle generation and audio-driver execution are explicit returned requests.
 * stats preserves the original 11-word race record at DS:8c22, including words
 * whose wider interpretation has not yet been reconstructed.
 */
export interface CrashRaceState {
  crash:number; speed:number; roadSpeed:number; yaw:number;
  abortFlag:number; timer:number; stats:number[]; savedStats:number[];
  elapsed:number; evaluationCause:number; replay:boolean; audioEnabled:boolean;
  preserveStats:boolean; audioHandles:number[];
}
export type CrashEffect = {type:'particles';car:0|1;yaw:number;mode:0} | {type:'audio';handle:number};
export function updateCrashState(before:CrashRaceState,cause:1|2|3|4|5,car:0|1) {
  const state={...before,stats:[...before.stats],savedStats:[...before.savedStats]};
  const effects:CrashEffect[]=[];
  if(state.crash) return {state,effects};
  let stop=false;
  if(cause===4){state.abortFlag=1;state.timer=1;}
  if(cause===5){cause=1;stop=true;}
  if(cause===1 || cause===2){
    state.crash=cause;
    if(cause===1) effects.push({type:'particles',car,yaw:state.yaw,mode:0});
    else stop=true;
    if(car===0){state.stats[8]=state.roadSpeed;state.timer=80;}
    if(!state.replay && state.audioEnabled) effects.push({type:'audio',handle:state.audioHandles[car]});
  } else if(cause===3){
    state.crash=3;
    if(car===0){state.stats[3]=(state.stats[2]+state.stats[7]+state.elapsed)&65535;state.timer=20;}
    else state.stats[4]=(state.stats[2]+state.elapsed)&65535;
  }
  if(stop){state.speed=0;state.roadSpeed=0;}
  state.stats[car===0?5:6]=state.stats[2];
  if(state.evaluationCause===0 && car===0) state.evaluationCause=cause;
  if(!state.preserveStats) state.savedStats=[...state.stats];
  return {state,effects};
}
