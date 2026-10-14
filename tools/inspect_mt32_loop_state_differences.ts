/** Compare candidate legacy loop periods without masking any state. These
 * candidates are existing calibration, not newly proved modern periods. */
import {readFileSync} from 'node:fs';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
const periods={titl:2394,slct:4788,vict:2580,over:3032};
for(const generation of ['ms-1990','ms-1991'] as const)for(const name of ['titl','slct','vict','over'] as const){
 const runtime=createOriginalMt32MusicRuntime(versionedMt32MusicSeed(JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8')),generation));
 const capture=()=>({state:{...runtime.state},argument:runtime.commandArgument,timers:runtime.timers.map(value=>Uint8Array.from(value)),voices:runtime.voices.map(value=>Uint8Array.from(value)),markers:Uint8Array.from(runtime.markers),lastNotes:Uint8Array.from(runtime.lastNotes),driver:Uint8Array.from(runtime.driver)});
 for(let tick=0;tick<100;tick++)runtime.tick();const before=capture();
 for(let tick=0;tick<periods[name];tick++)runtime.tick();const after=capture();
 const differences=(a:Uint8Array,b:Uint8Array)=>Array.from(a).flatMap((value,offset)=>value!==b[offset]?[offset.toString(16)]:[]);
 console.log(JSON.stringify({generation,name,fromCallback:100,candidatePeriod:periods[name],stateBefore:before.state,stateAfter:after.state,argument:[before.argument,after.argument],timers:before.timers.flatMap((value,index)=>{const offsets=differences(value,after.timers[index]);return offsets.length?[{index,activeBefore:!!new DataView(value.buffer).getUint32(0,true),offsets}]:[];}),voices:before.voices.flatMap((value,index)=>{const offsets=differences(value,after.voices[index]);return offsets.length?[{index,offsets}]:[];}),markers:differences(before.markers,after.markers),lastNotes:differences(before.lastNotes,after.lastNotes),driver:differences(before.driver,after.driver),fullLoopVerified:false}));
}
