export interface OriginalMenuAudioState {
 paused:number;guard:number;musicEnabled:number;soundEnabled:number;alternate:number;alternateVolume:number;trackCount:number;
 volumes:number[];pausedVolumes:number[];soundVolumes:number[];
}
export type OriginalMenuAudioEffect={type:'volume';owner:number;value:number}|{type:'update-voice';index:number}|{type:'flush'}|{type:'master-volume';value:number}|{type:'stop-tracks';first:number;last:number};
/** Supplied 29038/29116/29202/29524. Device writes are explicit effects;
 * pause preserves the music sequence rather than restarting its score. */
export function originalMenuAudioControl(before:OriginalMenuAudioState,operation:'pause-audio'|'resume-audio'|'toggle-music'|'toggle-sound'){
 const state={...before,volumes:[...before.volumes],pausedVolumes:[...before.pausedVolumes],soundVolumes:[...before.soundVolumes]},effects:OriginalMenuAudioEffect[]=[];
 const volume=(owner:number,value:number)=>{state.volumes[owner]=value&255;effects.push({type:'volume',owner,value:value&255});};
 let result=0;
 if(operation==='pause-audio'||operation==='resume-audio'){
  const pause=operation==='pause-audio';state.paused=1;state.guard=1;
  if(state.alternate){state.alternateVolume=pause?0:100;effects.push({type:'master-volume',value:state.alternateVolume});}
  else{
   for(let i=0;i<24;i++)if(state.soundEnabled===1||i<16){if(pause)state.pausedVolumes[i]=state.volumes[i];volume(i,pause?0:state.pausedVolumes[i]);}
   if(pause){for(let i=0;i<16;i++)effects.push({type:'update-voice',index:i});effects.push({type:'flush'});}
  }
  state.guard=0;if(!pause)state.paused=0;
 }else if(operation==='toggle-music'){
  if(state.musicEnabled===1){state.musicEnabled=0;if(state.trackCount)effects.push({type:'stop-tracks',first:0,last:state.trackCount-1});}
  else state.musicEnabled=1;
  result=state.musicEnabled;
 }else{
  if(state.soundEnabled===1){for(let i=16;i<24;i++){state.soundVolumes[i]=state.volumes[i];volume(i,0);}state.soundEnabled=0;}
  else{for(let i=16;i<24;i++)volume(i,state.soundVolumes[i]);state.soundEnabled=1;}
  result=state.soundEnabled;
 }
 return {state,effects,result};
}
