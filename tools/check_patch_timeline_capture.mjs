/** Read-only noninterference check against an independently rendered control. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,isAbsolute} from 'node:path';
const [control,candidate]=process.argv.slice(2);assert.ok(control&&candidate&&isAbsolute(control)&&isAbsolute(candidate)&&control!==candidate);
for(const song of ['titl','slct','vict','over']){
 for(const file of [song+'.wav',song+'-delivered-midi.json'])assert.ok(readFileSync(join(control,file)).equals(readFileSync(join(candidate,file))),'Patch observation changed '+file);
 const trace=JSON.parse(readFileSync(join(candidate,song+'-patch-states.json')));
 assert.equal(trace.generation,'ms-1991');assert.equal(trace.sampleRate,32000);
 assert.ok(trace.states.length>0);assert.equal(trace.states[0].fromFrame,0);assert.equal(trace.states[0].toFrame,0);
 let end=0;
 for(const state of trace.states){
  assert.ok(Number.isSafeInteger(state.fromFrame)&&Number.isSafeInteger(state.toFrame)&&state.fromFrame>=end&&state.toFrame>=state.fromFrame&&state.toFrame<=trace.frames);end=state.toFrame;
  assert.equal(state.patchTemp.length,144);assert.equal(state.channels.length,9);
  assert.ok([...state.patchTemp,...state.channels].every(value=>Number.isInteger(value)&&value>=0&&value<=127));
 }
 console.log(JSON.stringify({song,states:trace.states.length,pcmAndMidiUnchanged:true,exactProcessingTimestampsVerified:false}));
}
