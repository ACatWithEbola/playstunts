/** Compares generated note delivery, not mixed-recording pitch or listening.
 * Parser inherits original malformed-MIDI limitations disclosed in trace tool. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const duration=process.argv[2]??'60';
const rows=execFileSync(process.execPath,['tools/trace_mt32_opening_notes.ts',duration,'--all-notes'],{encoding:'utf8',maxBuffer:32*1024*1024}).trim().split('\n').map(JSON.parse);
for(const name of ['titl','slct','vict','over']){
 const ready=rows.find(row=>row.mode==='ready'&&row.generation==='ms-1991'&&row.name===name);
 const timed=rows.find(row=>row.mode==='timed'&&row.generation==='ms-1991'&&row.name===name);
 const count=Math.min(ready.allNotes.length,timed.allNotes.length),delays=[];
 for(let index=0;index<count;index++){
  assert.deepEqual(timed.allNotes[index].slice(1),ready.allNotes[index].slice(1),`${name}: note identity/order differs at${index}`);
  if(index>=12)delays.push(timed.allNotes[index][0]-ready.allNotes[index][0]);
 }
 const buckets=new Map();for(const delay of delays){const bucket=Math.round(delay/10)*10;buckets.set(bucket,(buckets.get(bucket)??0)+1);}
 console.log(JSON.stringify({name,duration:Number(duration),sharedNoteEventsMatched:count,unmatchedEndEvents:Math.abs(ready.allNotes.length-timed.allNotes.length),laterDelayBucketsMs:Object.fromEntries(buckets),minimumLaterDelayMs:Math.min(...delays),maximumLaterDelayMs:Math.max(...delays),physicalOrEnhancedRecordingFidelityVerified:false}));
}
