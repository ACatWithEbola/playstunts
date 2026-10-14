/** Offline source-timbre experiment; never a runtime synthesizer. */
import {renderHarmonicBass} from './render_harmonic_bass.mjs';
export function renderZonedHarmonicBass(notes,zones,sourceRate,rate,frames){
 if(!Array.isArray(zones)||!zones.length||zones.length>16||zones.some((zone,i)=>!Number.isInteger(zone.pitch)||zone.pitch<0||zone.pitch>127||(i>0&&zone.pitch<=zones[i-1].pitch)))throw Error('Invalid ordered timbre zones');
 // Validate even unused templates, without allocating a full silent song.
 for(const zone of zones)renderHarmonicBass([],zone.coefficients,sourceRate,rate,1);
 const groups=zones.map(()=>[]),assignments=[];
 for(const [index,note] of notes.entries()){
  let selected=0;
  for(let i=1;i<zones.length;i++)if(Math.abs(note.pitch-zones[i].pitch)<Math.abs(note.pitch-zones[selected].pitch))selected=i;
  groups[selected].push({index,note});
  assignments.push({noteIndex:index,sourceZonePitch:zones[selected].pitch,transposedSemitones:note.pitch-zones[selected].pitch});
 }
 const pcm=renderHarmonicBass([],zones[0].coefficients,sourceRate,rate,frames).pcm,events=new Array(notes.length);
 for(const [index,group] of groups.entries()){
  const result=renderHarmonicBass(group.map(item=>item.note),zones[index].coefficients,sourceRate,rate,frames);
  group.forEach((item,i)=>{events[item.index]=result.events[i];});
  for(let i=0;i<pcm.length;i++)pcm[i]+=result.pcm[i];
 }
 if(pcm.some(value=>!Number.isFinite(value)||Math.abs(value)>=1))throw Error('Nonfinite/clipped zoned audition');
 return {pcm,events,assignments,approvedForGame:false,sunoCharacterVerified:false};
}
