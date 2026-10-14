import assert from 'node:assert/strict';
import {originalGameTime,ms91GameTime,versionedGameTime} from '../lib/game/game-time-format.ts';
for(let ticks=0;ticks<32768;ticks++){
 assert.equal(ms91GameTime(ticks),originalGameTime(ticks));
 assert.equal(ms91GameTime(ticks,false),originalGameTime(ticks,false));
}
for(const rate of [10,20] as const){
 assert.equal(ms91GameTime(rate*65+rate/2,true,rate),' 1:05.50');
 assert.equal(ms91GameTime(rate*60,false,rate),' 1:00');
 assert.equal(ms91GameTime(65536+rate,true,rate),' 0:01.00');
}
assert.equal(ms91GameTime(65535,true,10),'09:13.50');
assert.equal(ms91GameTime(65535,true,20),'54:36.75');
for(const value of [-1,0,1,32767,32768,65535,65536]){
 assert.equal(versionedGameTime(value),originalGameTime(value));
 assert.equal(versionedGameTime(value,true,'ms-1990'),originalGameTime(value));
 assert.equal(versionedGameTime(value,true,'ms-1991',10),ms91GameTime(value,true,10));
}
assert.throws(()=>versionedGameTime(10,true,'ms-1990',10),/only verified for MS91/);
assert.throws(()=>versionedGameTime(10,true,'bb-1991',10),/only verified for MS91/);
console.log('MS91 unsigned cadence formatting;32768 positive20 Hz values preserve legacy text;10 Hz boundaries and word wrapping pass');
