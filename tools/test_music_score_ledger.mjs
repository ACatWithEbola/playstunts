import assert from 'node:assert/strict';
import {musicScoreLedger} from './music_score_ledger.mjs';
const events=[{frame:-1,status:0xc2,data:[30]},{frame:0,status:0x92,data:[47,100]},{frame:5,status:0xb2,data:[1,64]},{frame:6,status:0xe2,data:[0,64]},{frame:10,status:0x92,data:[47,0]}];
const ledger=musicScoreLedger(events,20),channel=ledger.channels[2];
assert.deepEqual([channel.startupEvents,channel.attacks,channel.releases,channel.controllers,channel.expression],[1,1,1,1,1]);
assert.deepEqual(channel.events,events);channel.events[0].data[0]=0;assert.equal(events[0].data[0],30);
for(const invalid of [[...events,{frame:4,status:0x92,data:[1,1]}],[{frame:20,status:0x92,data:[1,1]}],[{frame:0,status:0x92,data:[128,1]}],[{frame:0,status:0xf8,data:[]}]])assert.throws(()=>musicScoreLedger(invalid,20));
console.log('Complete channel ledger retains startup, attacks, zero-velocity releases and expression without inventing audio timing');
