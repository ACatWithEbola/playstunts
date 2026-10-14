import assert from 'node:assert/strict';
import {mt32DelayCounterFirstHighHalf} from '../lib/game/mt32-delay-counter.ts';
for(const [thresholdDifference,firstCrossing] of [[400,201],[65000,32501]]){
 const threshold=65535-thresholdDifference;
 assert.ok(mt32DelayCounterFirstHighHalf(firstCrossing-1)>=threshold);
 assert.ok(mt32DelayCounterFirstHighHalf(firstCrossing)<threshold);
}
assert.equal(mt32DelayCounterFirstHighHalf(1),65534);
assert.throws(()=>mt32DelayCounterFirstHighHalf(32768));
console.log('Verified mode3 first-half thresholds cross at201/32501 clocks, not400/65000 input clocks');
