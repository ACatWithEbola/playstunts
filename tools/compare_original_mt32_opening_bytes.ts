/** Compare against independently executed original sequence/voice/MT15 bodies.
 * Input is check_original_music_relocation.py --modern-mt15 output. This proves
 * byte order only, not physical timing, null-memory provenance or listening. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
const path=process.argv[2];
if(!path)throw Error('Provide independently generated original opening trace');
const rows=JSON.parse(readFileSync(path,'utf8')) as {name:string;device:string;engine:string;actualModernMt15Executed?:boolean;nullInstrumentMemoryExplicitlySeeded?:boolean;openingMidiPitTrace?:number[][]}[];
let cases=0;
const differences:string[]=[];
for(const name of ['titl','slct','vict','over']){
 const matches=rows.filter(row=>row.name===name.toUpperCase()&&row.device==='MT'&&row.engine==='ms-1991');
 assert.equal(matches.length,1);
 const original=matches[0];assert.equal(original.actualModernMt15Executed,true);
 if(original.nullInstrumentMemoryExplicitlySeeded)console.log(`${name}: retained null-memory fixture supplied to original emulator; DOS provenance not verified`);
 assert.ok(original.openingMidiPitTrace?.length);
 const seed=versionedMt32MusicSeed(JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8')),'ms-1991');
 const runtime=createOriginalMt32MusicRuntime(seed);
 const replacement=runtime.tick().writes.map(([port,byte])=>{assert.equal(port,0x330);return byte;});
 const expected=original.openingMidiPitTrace!.map(([,byte])=>byte);
 const first=Array.from({length:Math.max(replacement.length,expected.length)},(_,i)=>i).find(i=>replacement[i]!==expected[i]);
 if(first!==undefined){differences.push(name);console.log(`${name}: first mismatch at byte ${first}; replacement=${replacement[first]}, original=${expected[first]}`);}
 else console.log(`${name}: ${expected.length} original opening MIDI bytes match`);
 cases++;
}
assert.equal(cases,4);
assert.deepEqual(differences,[],'Opening MIDI differences remain; do not mark fidelity passed');
