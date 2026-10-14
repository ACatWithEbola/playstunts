import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {decodeNativeInitialDisplayData} from '../lib/game/browser-native-display-race.ts';
import {prepareNativeDisplayResultsResources} from '../lib/game/native-display-results-resources.ts';

// Exercise the real selected-format loader and heap, not mocked portrait frames.
const packet=JSON.parse(readFileSync('public/game/native-initial-data.json','utf8'));
let cases=0;
for(const mode of ['cga','tandy','ega'] as const){
 const source=decodeNativeInitialDisplayData(packet.modes[mode]);
 const before=source.data.slice();
 const resources=await prepareNativeDisplayResultsResources(mode,source,fixtureData.catalog);
 for(let cycle=0;cycle<2;cycle++)for(let opponent=1;opponent<=6;opponent++)for(const won of [false,true]){
  const loaded=await resources.evaluation(opponent,won);
  assert.deepEqual(loaded.first,loaded.frame('op01'));
  const address=loaded.first.segment*16+loaded.first.offset;
  assert.ok(address>0&&address<resources.owner.memory().length);
  assert.ok(resources.owner.memory().subarray(address,address+16).some(byte=>byte!==0),'Allocated frame must contain an actual bitmap header');
  cases++;
 }
 resources.release();resources.release();
 await assert.rejects(()=>resources.evaluation(0,true),/1 through 6/);
 assert.deepEqual(source.data,before,'Original initial data must not be changed');
}
console.log(JSON.stringify({cases,displayModes:3,repeatedReplacementAndRelease:true,originalInitialDataUnchanged:true,scoreWrites:false,pass:true}));
