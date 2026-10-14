import assert from 'node:assert/strict';
import {compareMacroCycles} from './compare_delivered_macro_cycles.mjs';
const anchors=Array.from({length:10},(_,i)=>i*3200),messages=[];
for(let i=0;i<9;i++){
 const delay=(i%4)*320;
 messages.push({frame:anchors[i]+100+delay,status:0x92,data:[60,100]},{frame:anchors[i]+1500+delay,status:0x82,data:[60,0]});
}
const correct=compareMacroCycles(messages,anchors,4);
assert.equal(correct.maximumFrameDifference,0);assert.ok(correct.allChannelMessagesMatch);assert.equal(correct.comparisons.length,5);
assert.ok(compareMacroCycles(messages,anchors,1).maximumFrameDifference>=320);
const shifted=structuredClone(messages);shifted[11].frame+=320;
assert.equal(compareMacroCycles(shifted,anchors,4).maximumFrameDifference,320,'Release drift must be measured');
const wrong=structuredClone(messages);wrong[11].data[0]=61;
assert.equal(compareMacroCycles(wrong,anchors,4).allChannelMessagesMatch,false);
assert.throws(()=>compareMacroCycles(messages,anchors.slice(0,8),4));
console.log('Four-phase attack/release recurrence detected; one-cycle assumption, shifted release, changed pitch and incomplete phase coverage rejected');
