import assert from 'node:assert/strict';
import {originalHighScoreRow} from '../lib/game/high-score-format.ts';
const record=Array(52).fill(0);record[0]=65;record[17]=66;record[50]=650&255;record[51]=650>>8;
const before=[...record],old=originalHighScoreRow(record);
assert.deepEqual(old,originalHighScoreRow(record,{physicsEngine:'ms-1990',framesPerSecond:20}));
assert.deepEqual(old,originalHighScoreRow(record,{physicsEngine:'ms-1991',framesPerSecond:20}));
// OriginalMS91 row routine forces20Hz even when active cadence is10.
assert.equal(String.fromCharCode(...originalHighScoreRow(record,{physicsEngine:'ms-1991',framesPerSecond:10}).fields[3]),' 0:32.50');
assert.deepEqual(record,before);
for(const ticks of [10,650,948,1800,12000]){
 const row=(value:number,rate:10|20)=>{const raw=before.slice();raw[50]=value&255;raw[51]=value>>>8;return originalHighScoreRow(raw,{physicsEngine:'ms-1991',framesPerSecond:rate}).fields[3];};
 assert.deepEqual(row(ticks,10),row(ticks,20),'Canonical HIG row units do not change with active cadence');
}
record[50]=record[51]=255;
assert.equal(String.fromCharCode(...originalHighScoreRow(record,{physicsEngine:'ms-1991',framesPerSecond:10}).fields[3]),' 0:00.00');
console.log('OriginalMS91 score rows force20Hz; record bytes and empty-time sentinel preserved');
