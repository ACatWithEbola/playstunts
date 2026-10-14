/** Original delivered MIDI only: distinguish startup from steady repeats.
 * This does not certify the mixed remix's individual notes or physical timing. */
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
import {decodeDeliveredMidi} from './decode_delivered_midi.mjs';
const options=process.argv.slice(2).filter(v=>v.startsWith('--delivered-dir='));assert.ok(options.length<=1);
const directory=options[0]?.slice(16);if(directory)assert.ok(isAbsolute(directory));
const rows=directory?['titl','slct','vict','over'].map(name=>{
 const path=join(directory,name+'-delivered-midi.json'),trace=JSON.parse(readFileSync(path)),decoded=decodeDeliveredMidi(trace.events);
 assert.equal(trace.sampleRate,32000);assert.equal(decoded.partial,null);assert.ok(decoded.interruptions.every(e=>e.kind==='unterminated-sysex'));
 return {mode:'timed',generation:trace.generation,name,deliverySource:path,allNotes:decoded.messages.filter(e=>e.frame>=0&&(e.status&240)===144&&e.data[1]>0).map(e=>[e.frame*1000/trace.sampleRate,e.status&15,...e.data])};
}):execFileSync(process.execPath,['tools/trace_mt32_opening_notes.ts','120','--all-notes'],{encoding:'utf8',maxBuffer:32*1024*1024}).trim().split('\n').map(JSON.parse);
for(const row of rows.filter(row=>row.mode==='timed')){
 const notes=row.allNotes,identity=notes.slice(0,12).map(note=>JSON.stringify(note.slice(1)));
 const openings=[];
 for(let index=0;index+identity.length<=notes.length;index++){
  if(!identity.every((note,offset)=>JSON.stringify(notes[index+offset].slice(1))===note))continue;
  const at=notes[index][0];
  // This motif also occurs within the song: keep independently separated
  // full-cycle candidates, not every local motif occurrence.
  const minimumSeparationMs=row.name==='slct'?40000:20000;
  if(openings.length&&at-openings.at(-1).firstNoteMs<minimumSeparationMs)continue;
  openings.push({index,firstNoteMs:at,firstSixRelativeMs:notes.slice(index,index+6).map(note=>note[0]-at)});
 }
 if(openings.length<3){
  assert.notEqual(row.name,'slct','Missing established three Menu opening candidates');
  // A startup-only phrase may not recur. Search later anchors, then compare
  // entire adjacent cycles; a local motif alone is not a repeat certificate.
  let steadyCandidate=null;
  for(let anchor=12;anchor<Math.min(200,notes.length-12)&&!steadyCandidate;anchor++){
   const motif=notes.slice(anchor,anchor+12).map(note=>JSON.stringify(note.slice(1)));
   const matches=[];
   for(let index=anchor;index+12<=notes.length;index++){
    if(!motif.every((note,offset)=>JSON.stringify(notes[index+offset].slice(1))===note))continue;
    if(matches.length&&notes[index][0]-notes[matches.at(-1)][0]<20000)continue;
    matches.push(index);
   }
   if(matches.length<3)continue;
   const a=notes.slice(matches[0],matches[1]),b=notes.slice(matches[1],matches[2]);
   if(a.length!==b.length||!a.every((note,index)=>JSON.stringify(note.slice(1))===JSON.stringify(b[index].slice(1))))continue;
   const differences=a.map((note,index)=>(note[0]-a[0][0])-(b[index][0]-b[0][0]));
   const completeCycles=matches.slice(0,-1).map((start,index)=>notes.slice(start,matches[index+1]));
   const allCompleteCycleIdentitiesMatch=completeCycles.every(cycle=>cycle.length===a.length&&cycle.every((note,index)=>JSON.stringify(note.slice(1))===JSON.stringify(a[index].slice(1))));
   const adjacentCycleTiming=completeCycles.slice(1).map((cycle,index)=>{
    const prior=completeCycles[index],differences=cycle.map((note,i)=>(note[0]-cycle[0][0])-(prior[i][0]-prior[0][0]));
    const shifted=differences.flatMap((difference,i)=>Math.abs(difference)>1?[{index:i,channel:cycle[i][1],pitch:cycle[i][2],differenceMs:difference}]:[]);
    return {fromCycle:index,toCycle:index+1,maxAbsoluteDifferenceMs:Math.max(...differences.map(Math.abs)),shiftedNotesAboveOneMs:shifted.length,examples:shifted.slice(0,8)};
   });
   const macroCycleTiming=[];
   for(let lag=2;lag<completeCycles.length;lag++){
    let maximum=0;
    for(let index=lag;index<completeCycles.length;index++){
     const cycle=completeCycles[index],prior=completeCycles[index-lag];
     for(let i=0;i<cycle.length;i++)maximum=Math.max(maximum,Math.abs((cycle[i][0]-cycle[0][0])-(prior[i][0]-prior[0][0])));
    }
    macroCycleTiming.push({lag,comparisons:completeCycles.length-lag,maxAbsoluteDifferenceMs:maximum});
   }
   steadyCandidate={anchorIndex:anchor,noteCount:a.length,anchorTimesMs:matches.map(index=>notes[index][0]),intervalsMs:matches.slice(1).map((index,offset)=>notes[index][0]-notes[matches[offset]][0]),completeCyclesCompared:completeCycles.length,allCompleteCycleIdentitiesMatch,relativeTimingDifferenceRangeMs:[Math.min(...differences),Math.max(...differences)],adjacentCycleTiming,macroCycleTiming,...(process.argv.includes('--boundary-notes')?{initialNotes:notes.slice(0,anchor),precedingRepeatAnchorNotes:matches.slice(1,3).map(index=>notes.slice(index-anchor,index))}:{})};
  }
  console.log(JSON.stringify({generation:row.generation,name:row.name,openingCandidates:openings,steadyCandidate,reason:'Startup motif does not establish a loop; later full-note-cycle comparison remains delivery-only evidence',fullLoopOrRemixVerified:false}));
  continue;
 }
 const firstCycle=notes.slice(openings[0].index,openings[1].index);
 const secondCycle=notes.slice(openings[1].index,openings[2].index);
 const identitiesMatch=firstCycle.length===secondCycle.length&&firstCycle.every((note,index)=>JSON.stringify(note.slice(1))===JSON.stringify(secondCycle[index].slice(1)));
 const relativeTimingDifferencesMs=identitiesMatch?firstCycle.map((note,index)=>(note[0]-firstCycle[0][0])-(secondCycle[index][0]-secondCycle[0][0])):[];
 const afterOpening=relativeTimingDifferencesMs.slice(6);
 const cycles=openings.slice(0,-1).map((opening,index)=>notes.slice(opening.index,openings[index+1].index));
 const steadyCycleComparisons=cycles.slice(2).map((cycle,index)=>{
  const prior=cycles[index+1],same=prior.length===cycle.length&&prior.every((note,i)=>JSON.stringify(note.slice(1))===JSON.stringify(cycle[i].slice(1)));
  const differences=same?cycle.map((note,i)=>(note[0]-cycle[0][0])-(prior[i][0]-prior[0][0])):[];
  return {fromCycle:index+1,toCycle:index+2,noteCount:cycle.length,identitiesMatch:same,maxAbsoluteDifferenceMs:same?Math.max(...differences.map(Math.abs)):null,shiftedNotesAboveOneMs:same?differences.filter(v=>Math.abs(v)>1).length:null};
 });
 console.log(JSON.stringify({generation:row.generation,name:row.name,openings:openings.slice(0,3),intervalsMs:openings.slice(1,3).map((opening,index)=>opening.firstNoteMs-openings[index].firstNoteMs),deliveredNoteCycles:{firstCount:firstCycle.length,secondCount:secondCycle.length,identitiesMatch,maxRelativeTimingDifferenceMs:relativeTimingDifferencesMs.length?Math.max(...relativeTimingDifferencesMs.map(Math.abs)):null,firstSixTimingDifferencesMs:relativeTimingDifferencesMs.slice(0,6),afterOpeningTimingDifferenceRangeMs:afterOpening.length?[Math.min(...afterOpening),Math.max(...afterOpening)]:null},steadyCycleComparisons,fullLoopOrRemixVerified:false}));
}
