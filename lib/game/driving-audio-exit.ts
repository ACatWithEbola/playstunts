export interface DrivingAudioExitState {active:number;read:number;write:number;playerFlags:number;opponentFlags:number;opponentEnabled:number;playerHandle:number;opponentHandle:number}
/** Original producer exit branch 0xa67f-0xa6ee. Its caller has already selected
 * this branch using DS:9aca. Global audio reset runs even when inactive.
 */
export function drivingAudioExit(before:DrivingAudioExitState){
 const state={...before};const calls:{kind:'skid-stop'|'engine-stop'|'reset';handle?:number}[]=[];
 if(state.active){
  state.read=state.write;
  const stop=(flags:number,handle:number)=>{if(flags&6)calls.push({kind:'skid-stop',handle});if(flags&1)calls.push({kind:'engine-stop',handle});};
  stop(state.playerFlags,state.playerHandle);
  if(state.opponentEnabled)stop(state.opponentFlags,state.opponentHandle);
  state.active=0;state.playerFlags=0;state.opponentFlags=0;
 }
 calls.push({kind:'reset'});return {state,calls};
}
