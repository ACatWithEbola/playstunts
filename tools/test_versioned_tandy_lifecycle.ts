import assert from 'node:assert/strict';
import {versionedTd15Resource} from '../lib/game/versioned-td15-resource.ts';
import {initializeOriginalTandy,silenceOriginalTandy,stopOriginalTandyChannel,shutdownOriginalTandy} from '../lib/game/tandy-lifecycle.ts';
import {originalTandyToneWrites,originalTandyVolumeWrites} from '../lib/game/tandy-control.ts';
const driver=versionedTd15Resource('ms-1991')!,previous={offset:1234,segment:5678};
const init=initializeOriginalTandy(driver,0x2000,0xff,previous,'ms-1991');
assert.equal(init.channels,6);assert.deepEqual(init.installVector,previous);assert.deepEqual(init.bios,[]);
assert.deepEqual(init.writes,[[0x43,0xb6],[0x61,254],...[1,2,3,4].flatMap(ch=>originalTandyVolumeWrites(driver,ch,0,'ms-1991')),[0xc4,0]]);
assert.deepEqual([...driver.slice(0x5af,0x5b5)],Array(6).fill(15));
for(let channel=0;channel<6;channel++){
 const result=stopOriginalTandyChannel(driver,0x2000,channel,0xff,'ms-1991');
 assert.deepEqual(result.bios,[]);assert.deepEqual(result.writes,channel<=4?[...originalTandyToneWrites(driver,channel,0,'ms-1991'),...originalTandyVolumeWrites(driver,channel,0,'ms-1991')]:[[0x61,252]]);
}
assert.equal(shutdownOriginalTandy(driver,0x2000,255,'ms-1991').restoreVector,undefined);
driver[0x595]=1;const snapshot=driver.slice();assert.throws(()=>silenceOriginalTandy(driver,0x2000,255,'ms-1991'));assert.deepEqual(driver,snapshot);
console.log('Modern Tandy idle lifecycle: init/silence/shutdown,no BIOS/vector installation,all six exact stop branches,active sample wait explicitly required');
