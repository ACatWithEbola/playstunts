/** Includes releases, controllers and program changes, not only note attacks.
 * Diagnostic parser omits SysEx and inherits disclosed malformed-MIDI behavior.
 * Shared-prefix comparison does not certify unmatched end events or recordings. */
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const duration=process.argv[2]??'120';
const rows=execFileSync(process.execPath,['tools/trace_mt32_opening_notes.ts',duration,'--all-events'],{encoding:'utf8',maxBuffer:64*1024*1024}).trim().split('\n').map(JSON.parse);
for(const generation of ['ms-1990','ms-1991'])for(const name of ['titl','slct','vict','over']){
 const ready=rows.find(row=>row.mode==='ready'&&row.generation===generation&&row.name===name).allEvents;
 const timed=rows.find(row=>row.mode==='timed'&&row.generation===generation&&row.name===name).allEvents;
 const count=Math.min(ready.length,timed.length),types=new Map();
 for(let index=0;index<count;index++){
  assert.deepEqual(timed[index].slice(1),ready[index].slice(1),`${generation}/${name}: channel event differs at ${index}`);
  const type=(timed[index][1]&0xf0).toString(16);types.set(type,(types.get(type)??0)+1);
 }
 console.log(JSON.stringify({generation,name,duration:Number(duration),sharedChannelEventsMatched:count,types:Object.fromEntries(types),unmatchedEndEvents:Math.abs(ready.length-timed.length),sysExPhysicalOrRecordingVerified:false}));
}
