import assert from 'node:assert/strict';
import {createOriginalTandyDacClock} from '../lib/game/tandy-dac-clock.ts';
import {createLegacyTandyChipDevice} from '../lib/game/legacy-tandy-chip-device.ts';
for(const divisor of [1,3,123,4095])for(const prefix of [0,1,17])for(const span of [0,1,2,123,10000]){
 const full=createOriginalTandyDacClock(divisor,7),fast=createOriginalTandyDacClock(divisor,7);
 full.advanceClocks(prefix);fast.advanceClocks(prefix);full.advanceClocks(span);fast.skipClocks(span);assert.deepEqual(fast.snapshot(),full.snapshot());
 full.write(0xc6,100);fast.write(0xc6,100);assert.deepEqual(fast.advanceClocks(1000),full.advanceClocks(1000));
}
let grants=0,completionTick=-1;
const device=createLegacyTandyChipDevice(()=>128,{divisor:1,volume:0,grant:()=>{grants++;return true;},completion(_ax,tick){completionTick=tick;}});
device.play({ax:0x8300,es:0,bx:0,cx:1,dx:1});const active=device.snapshot();assert.throws(()=>device.skipIdle(1000000),/active/);assert.deepEqual(device.snapshot(),active);
device.advance(1);assert.equal(grants,1);device.skipIdle(1000000);assert.equal(grants,1);assert.deepEqual(device.snapshot().pending,['completion']);assert.equal(completionTick,-1);
device.serviceInterrupt(true);assert.equal(completionTick,1000001);device.close();
const clock=createOriginalTandyDacClock(4095,7);clock.skipClocks(Number.MAX_SAFE_INTEGER);assert.equal(clock.snapshot().remaining,4095-Number(BigInt(Number.MAX_SAFE_INTEGER)%BigInt(4095)));
console.log('Explicit idle fast-forward preserves divider phase across60 profiles/register reload, keeps completion pending and rejects active DMA without mutation; million idle clocks issue no owner grants');
