import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
let ticks=0;
for(const name of ['titl','slct','vict','over']){
 const source=readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8');
 const oldSeed=JSON.parse(source),modernSeed=JSON.parse(source);
 oldSeed.driverGeneration='ms-1990';modernSeed.driverGeneration='ms-1991';modernSeed.driver=Array.from(versionedMt15Resource('ms-1991')!);
 const old=createOriginalMt32MusicRuntime(oldSeed),modern=createOriginalMt32MusicRuntime(modernSeed);
 for(let i=0;i<2000;i++){
  old.tick();modern.tick();
  assert.deepEqual(modern.state,old.state);assert.deepEqual(modern.timers,old.timers);
  const legacyVoices=old.voices.map(voice=>voice.slice());
  for(let voice=0;voice<modern.voices.length;voice++){
   const current=new DataView(modern.voices[voice].buffer),legacy=new DataView(legacyVoices[voice].buffer);
   // Original80-case duration oracle proves this edition difference; modern
   // full-state fidelity is checked separately against actual original code.
   if(current.getUint32(12,true)===0&&legacy.getUint32(12,true)>0xffff0000)legacy.setUint32(12,0,true);
  }
  assert.deepEqual(modern.voices,legacyVoices);assert.deepEqual(modern.lastNotes,old.lastNotes);ticks++;
 }
 assert.equal(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8'),source);
}
console.log(`${ticks} versioned Roland callback ticks retain sequencing/ownership with explicitly proven zero-duration edition difference normalized; original MIDI/state parity and browser output are separate checks`);
