import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {versionedPcMusicSeed} from '../lib/game/versioned-pc-music-seed.ts';
import {createOriginalPcSpeakerMusicRuntime} from '../lib/game/pc-speaker-music-runtime.ts';
const rows=JSON.parse(readFileSync(process.argv[2],'utf8'));
let ticks=0;
const expectedCases=new Set(['ms-1990','ms-1991'].flatMap(engine=>['TITL','SLCT','VICT','OVER'].map(name=>`${engine}/${name}`))),seen=new Set<string>();
for(const row of rows.filter((value:{device:string})=>value.device==='PC')){
 const identity=`${row.engine}/${row.name}`;
 assert.ok(expectedCases.has(identity),'Unexpected PC startup capture: '+identity);
 assert.ok(!seen.has(identity),'Duplicate PC case cannot replace missing score/edition coverage: '+identity);seen.add(identity);
 assert.equal(row.actualTimerResetExecuted,true);assert.equal(row.allTimers.length,24);
 for(const timer of row.allTimers)assert.equal(timer.length,row.engine==='ms-1991'?76:72,'Complete captured timer required');
 const path=`public/game/pc-music-${row.name.toLowerCase()}-seed.json`,source=readFileSync(path,'utf8');
 const native=versionedPcMusicSeed(JSON.parse(source),row.engine),captured=structuredClone(native);
 for(let owner=0;owner<24;owner++){
  const callbackOwned=owner<row.tracks||(owner===6&&row.tracks<7);
  if(callbackOwned)for(const offset of [51,52,53,54,67])captured.timers[owner][offset]=row.allTimers[owner][offset];
  if(owner===6&&row.tracks<7)for(const offset of [5,6,7,8,46,47,48,49])captured.timers[owner][offset]=row.allTimers[owner][offset];
 }
 const a=createOriginalPcSpeakerMusicRuntime(native),b=createOriginalPcSpeakerMusicRuntime(captured);
 for(let tick=0;tick<2000;tick++){
  assert.deepEqual(b.tick(),a.tick(),`${row.engine}/${row.name}/${tick}: callback-address metadata cannot alter emitted PC ports`);
  assert.deepEqual(b.driver,a.driver);assert.deepEqual(b.voices,a.voices);assert.deepEqual(b.lastNotes,a.lastNotes);assert.deepEqual(b.state,a.state);ticks++;
 }
 assert.equal(readFileSync(path,'utf8'),source);
}
assert.equal(ticks,16000,'Both editions and all four PC scores required');
assert.deepEqual(seen,expectedCases,'Complete PC score/edition ownership coverage required');
console.log('16000 PC music ticks retain identical output/driver/voices when callback and reserved metadata use original reset capture; native runtime owns callbacks, not DOS far pointers');
