import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createControlledOriginalTandyMusic} from '../lib/game/controlled-tandy-music.ts';
import {tandyDriverLayout} from '../lib/game/tandy-driver-layout.ts';
let ticks=0;
for(const name of ['titl','slct','vict','over']){
 const source=readFileSync(`public/game/tandy-music-${name}-seed.json`,'utf8'),seed=JSON.parse(source),snapshot=JSON.stringify(seed);
 const old=createControlledOriginalTandyMusic(seed,'ms-1990'),modern=createControlledOriginalTandyMusic(seed,'ms-1991');
 assert.deepEqual(old.runtime.initialWrites,seed.initialWrites,'Legacy initialization remains unchanged');
 assert.ok(modern.runtime.initialWrites.some(([port,value])=>port===0xc4&&value===0),'Modern sample-device reset must be delivered, not discarded');
 const retained=modern.runtime.initialWrites;retained[0][1]^=255;assert.notDeepEqual(modern.runtime.initialWrites,retained,'Startup writes are independently owned');
 for(let i=0;i<5000;i++){
  old.tick(0);const result=modern.tick(0);assert.equal(result.bios.length,0,`${name}: modern uses no BIOS sample path`);
  assert.deepEqual(modern.runtime.state,old.runtime.state,`${name}/${i} sequence clock`);
  assert.deepEqual(modern.runtime.timers,old.runtime.timers,`${name}/${i} timers`);
  assert.deepEqual(modern.runtime.lastNotes,old.runtime.lastNotes);
  const normalize=(voices:Uint8Array[])=>voices.map(v=>{const copy=v.slice();copy[6]=copy[7]=0;return copy;});
  const modernVoices=normalize(modern.runtime.voices),oldVoices=normalize(old.runtime.voices);
  // Independently executed common duration helpers prove modern zero stays
  // zero while legacy wraps/decrements. Only that known generated-wrap case
  // is normalized; ownership/envelopes and every other duration still compare.
  for(let voice=0;voice<modernVoices.length;voice++){
   const current=new DataView(modernVoices[voice].buffer),legacy=new DataView(oldVoices[voice].buffer);
   if(current.getUint32(12,true)===0&&legacy.getUint32(12,true)>0xffff0000)legacy.setUint32(12,0,true);
  }
  assert.deepEqual(modernVoices,oldVoices,`${name}/${i} voices except documented pitch/zero-duration edition differences`);
  ticks++;
 }
 for(const operation of ['pause-audio','resume-audio','toggle-music','toggle-music'] as const){
  old.control(operation,0);const result=modern.control(operation,0);assert.equal(result.bios.length,0);assert.deepEqual(modern.state,old.state);
 }
 const layout=tandyDriverLayout('ms-1991');assert.equal(modern.runtime.driver.length,layout.bytes);
 assert.equal(JSON.stringify(seed),snapshot);assert.equal(readFileSync(`public/game/tandy-music-${name}-seed.json`,'utf8'),source);
}
console.log(`Four Tandy scores/${ticks} ticks retain sequencing,timers,voice ownership and menu controls; documented pitch and zero-duration edition differences normalized; no modern BIOS requests or source mutation`);
