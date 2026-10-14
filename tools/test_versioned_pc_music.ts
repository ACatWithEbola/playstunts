import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {versionedPcMusicSeed} from '../lib/game/versioned-pc-music-seed.ts';
import {createControlledOriginalPcSpeakerMusic} from '../lib/game/controlled-pc-speaker-music.ts';
import {createOriginalPcSpeakerMusicStream} from '../lib/game/pc-speaker-audio.ts';
let ticks=0,samples=0;
for(const name of ['titl','slct','vict','over']){
 const seed=JSON.parse(readFileSync(`public/game/pc-music-${name}-seed.json`,'utf8')),snapshot=JSON.stringify(seed);
 assert.equal(versionedPcMusicSeed(seed),seed);assert.equal(versionedPcMusicSeed(seed,'ms-1990'),seed);
 const modernSeed=versionedPcMusicSeed(seed,'ms-1991');
 assert.equal(modernSeed.hardware.length,7);assert.equal(modernSeed.driver.length,0x2e9);
 const legacy=createControlledOriginalPcSpeakerMusic(seed),modern=createControlledOriginalPcSpeakerMusic(modernSeed);
 for(let i=0;i<5000;i++){
  legacy.tick();const writes=modern.tick();
  assert.deepEqual(modern.runtime.state,legacy.runtime.state,`${name}/${i}: sequence clock`);
  assert.deepEqual(modern.runtime.timers,legacy.runtime.timers,`${name}/${i}: timers`);
  assert.deepEqual(modern.runtime.lastNotes,legacy.runtime.lastNotes);
  assert.ok(writes.every(([port])=>[0x40,0x42,0x43,0x61].includes(port)));ticks++;
 }
 for(const operation of ['pause-audio','resume-audio','toggle-music','toggle-music'] as const){
  modern.control(operation);legacy.control(operation);assert.deepEqual(modern.state,legacy.state);
 }
 for(const rate of [44100,48000]){
  const make=()=>createOriginalPcSpeakerMusicStream(createControlledOriginalPcSpeakerMusic(modernSeed),modernSeed.initialWrites,rate);
  const stream=make(),whole=stream.render(48000),split=make(),parts=[17,100,333,47550].map(n=>split.render(n));
  assert.deepEqual(whole,Float32Array.from(parts.flatMap(p=>Array.from(p))));
  assert.ok(whole.every(Number.isFinite));assert.ok(whole.some(v=>v!==0),`${name}: generated sound`);samples+=whole.length;
 }
 assert.equal(JSON.stringify(seed),snapshot,'Captured legacy seed stays unchanged');
}
assert.throws(()=>versionedPcMusicSeed({...JSON.parse(readFileSync('public/game/pc-music-titl-seed.json','utf8')),hardware:[]},'ms-1991'),/inactive five-slot/);
console.log(`Four PC scores: ${ticks} versioned sequence ticks and ${samples} finite PCM samples; split rendering exact, controls and legacy seeds preserved`);
