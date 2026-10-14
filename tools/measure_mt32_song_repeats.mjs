/** Exact generated-note motif repetition; not enhanced recording alignment.
 * A missing motif is reported, never treated as successful loop calibration. */
import {execFileSync} from 'node:child_process';
const rows=execFileSync(process.execPath,['tools/trace_mt32_opening_notes.ts','120','--all-notes'],{encoding:'utf8',maxBuffer:32*1024*1024}).trim().split('\n').map(JSON.parse);
for(const row of rows.filter(row=>row.generation==='ms-1991')){
 const notes=row.allNotes,motif=notes.slice(0,12).map(note=>JSON.stringify(note.slice(1))),starts=[];
 for(let index=0;index+motif.length<=notes.length;index++)if(motif.every((identity,offset)=>JSON.stringify(notes[index+offset].slice(1))===identity))starts.push({index,ms:notes[index][0]});
 console.log(JSON.stringify({mode:row.mode,name:row.name,motifLength:12,repetitions:starts,intervalsMs:starts.slice(1).map((start,index)=>start.ms-starts[index].ms),fullLoopStateOrRecordingVerified:false}));
}
