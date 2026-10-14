import assert from 'node:assert/strict';
import {originalHighScoreRow} from '../lib/game/high-score-format.ts';
import {ms91GameTime,originalGameTime} from '../lib/game/game-time-format.ts';
const raw=Array(52).fill(0);raw.splice(0,6,...Array.from('MARCO\0',c=>c.charCodeAt(0)));raw.splice(17,5,...Array.from('INDY\0',c=>c.charCodeAt(0)));
let checks=0;
for(let ticks=0;ticks<65536;ticks++){
 raw[50]=ticks&255;raw[51]=ticks>>>8;const before=raw.slice(),count=ticks===65535?0:ticks;
 for(const framesPerSecond of [10,20] as const){
  const row=originalHighScoreRow(raw,{physicsEngine:'ms-1991',framesPerSecond});
  assert.equal(String.fromCharCode(...row.fields[3]),ms91GameTime(count,true,20));checks++;
 }
 for(const physicsEngine of [undefined,'ms-1990'] as const){
  assert.equal(String.fromCharCode(...originalHighScoreRow(raw,{physicsEngine}).fields[3]),originalGameTime(count));checks++;
 }
 assert.deepEqual(raw,before);
}
console.log(JSON.stringify({scoreRowChecks:checks,allUnsignedTickValues:true,modernSavedRowsAlways20Hz:true,legacyUnchanged:true,sourceRecordsUnchanged:true,pass:true}));
