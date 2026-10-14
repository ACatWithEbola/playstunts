/** Pitch context evidence, not a claim of audible fidelity or instrument identity. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {decodeDeliveredMidi} from './decode_delivered_midi.mjs';
import {mt32PitchBendUnits} from './mt32_pitch_bend_units.mjs';
const channelsByScore={titl:[2,3,5],slct:[2,5,8],vict:[2,3,4,5],over:[2,5,6]};
export function auditPitchContext(trace,patches,score){
 assert.ok(Object.hasOwn(channelsByScore,score),'Unknown score');
 assert.equal(trace.generation,'ms-1991');assert.equal(patches.generation,'ms-1991');
 assert.equal(trace.sampleRate,32000);assert.equal(patches.sampleRate,trace.sampleRate);assert.equal(patches.frames,trace.frames);
 assert.ok(patches.states.length>0,'No patch context');
 let previous=-1;
 for(const state of patches.states){
  assert.ok(Number.isSafeInteger(state.fromFrame)&&Number.isSafeInteger(state.toFrame)&&state.fromFrame>=previous&&state.toFrame>=state.fromFrame&&state.toFrame<=trace.frames,'Invalid patch timeline');previous=state.toFrame;
  for(const channel of channelsByScore[score]){
   const parts=state.channels.flatMap((value,index)=>value===channel?[index]:[]);
   assert.equal(parts.length,1,'Missing or ambiguous channel assignment');const part=parts[0];
   assert.equal(state.patchTemp[part*16+2],24,'Unmodeled coarse key shift');
   assert.equal(state.patchTemp[part*16+3],50,'Nonneutral original fine tune must be documented separately');
   assert.equal(state.patchTemp[part*16+5],0,'Unsupported multi-assign patch');
   const range=state.patchTemp[part*16+4];assert.ok(Number.isInteger(range)&&range>=0&&range<=24,'Invalid bend sensitivity');
  }
 }
 const decoded=decodeDeliveredMidi(trace.events);assert.equal(decoded.partial,null);
 assert.ok(decoded.interruptions.every(event=>event.kind==='unterminated-sysex'));
 const channels=channelsByScore[score].map(channel=>{
  const bends=decoded.messages.filter(event=>(event.status&240)===224&&(event.status&15)===channel&&event.frame>=0);
  const values=bends.map(event=>{
   const state=patches.states.findLast(state=>state.toFrame<=event.frame);assert.ok(state,'Pitch wheel lacks preceding patch context');
   const part=state.channels.indexOf(channel),range=state.patchTemp[part*16+4],value=event.data[0]+event.data[1]*128;
   return {frame:event.frame,value,range,units:mt32PitchBendUnits(value,range)};
  });
  return {channel,wheelEvents:values.length,minUnits:Math.min(0,...values.map(event=>event.units)),maxUnits:Math.max(0,...values.map(event=>event.units)),maxAbsoluteSemitones:Math.max(0,...values.map(event=>Math.abs(event.units)*12/4096)),wheelTimeline:values};
 });
 return {score,patchStates:patches.states.length,channels,neutralCoarseAndFinePatchPitch:true,originalExpressionApplied:false,audibleFidelityVerified:false,scope:'Raw MIDI keys have neutral patch transposition; original wheel expression measured but not classified as vibrato or melody and not copied into Suno candidates'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const [trace,patches,score]=process.argv.slice(2);console.log(JSON.stringify(auditPitchContext(JSON.parse(readFileSync(trace)),JSON.parse(readFileSync(patches)),score)));
}
