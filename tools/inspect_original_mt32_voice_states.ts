/** Raw voice-state differences are diagnostic, not automatically bugs: the
 * isolated original driver installation and outer IRQ remain explicit fixtures. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
const path=process.argv[2];if(!path)throw Error('Provide original voice-state snapshot trace');
const rows=JSON.parse(readFileSync(path,'utf8'));
for(const row of rows.filter((row:any)=>row.actualModernMt15Executed)){
 assert.ok(row.voiceStateSnapshots?.length);
 const seed=versionedMt32MusicSeed(JSON.parse(readFileSync(`public/game/mt32-music-${row.name.toLowerCase()}-seed.json`,'utf8')),'ms-1991');
 const runtime=createOriginalMt32MusicRuntime(seed);let first:unknown;
 for(const snapshot of row.voiceStateSnapshots){
  runtime.tick();const differences=[];
  for(let voice=0;voice<16;voice++){
   const original=[...snapshot.voices[voice]],pointer=original[42]|original[43]<<8;
   if(pointer){
    const owner=(pointer-0x8678)/76;
    assert.ok(Number.isInteger(owner)&&owner>=0&&owner<24,'Unexpected original timer pointer');
    const mapped=0x801e+owner*72;original[42]=mapped&255;original[43]=mapped>>>8;
   }
   for(let field=0;field<46;field++)if(runtime.voices[voice][field]!==original[field])differences.push({voice,field,replacement:runtime.voices[voice][field],original:original[field]});
  }
  if(differences.length&&!first)first={callback:snapshot.callback,differences:differences.slice(0,20),differenceCount:differences.length};
 }
 console.log(JSON.stringify({name:row.name,callbacks:row.voiceStateSnapshots.length,timerPointersNormalized:true,firstSemanticDifference:first??null,fixtureProvenanceVerified:false}));
 if(process.argv.includes('--assert-equal'))assert.equal(first,undefined,`${row.name}: normalized original voice state differs`);
}
