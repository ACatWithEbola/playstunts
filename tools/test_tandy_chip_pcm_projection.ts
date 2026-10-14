import assert from 'node:assert/strict';
import {createTandyChipPcmProjection} from '../lib/game/tandy-chip-pcm-projection.ts';
import {createLegacyTandyChipDevice} from '../lib/game/legacy-tandy-chip-device.ts';
import {originalTandyDacGain} from '../lib/game/tandy-dac-transfer.ts';
for(const rate of [44100,48000]){
 const events=[[0,0.25],[1,-0.5],[4,0.75],[7,1],[81,0],[100,-1],[100,0.5],[4095,0]];
 const fixture=()=>{const owner=createTandyChipPcmProjection(rate,3579545,0);for(const [tick,level] of events)owner.record(tick,level);return owner;};
 const whole=fixture(),split=fixture();const expected=whole.render(100,10000),actual=[...split.render(1,10000),...split.render(9,10000),...split.render(90,10000)];
 assert.deepEqual(actual,[...expected]);assert.deepEqual(split.snapshot(),whole.snapshot());
 for(let frame=0;frame<100;frame++){const tick=Math.floor(frame*3579545/rate),last=events.filter(event=>event[0]<=tick).at(-1);assert.equal(expected[frame],last?.[1]??0);}
 whole.close();split.close();assert.throws(()=>whole.render(1,10000),/closed/);
 const projection=createTandyChipPcmProjection(rate,3579545,0),samples=[0,255,64,192];let completions=0;
 const device=createLegacyTandyChipDevice(address=>samples[address],{divisor:123,volume:7,grant:()=>true,byte(tick,value,volume){projection.record(tick,(value-128)/128*originalTandyDacGain(volume));},completion(){completions++;}});
 device.play({ax:0x8307,es:0,bx:0,cx:4,dx:123});device.advance(1000);
 const pcm=projection.render(10,device.snapshot().clock.tick);
 for(let frame=0;frame<10;frame++){const consumed=Math.min(4,Math.floor(Math.floor(frame*3579545/rate)/123));assert.equal(pcm[frame],consumed?(samples[consumed-1]-128)/128:0);}
 assert.equal(completions,0);device.serviceInterrupt(true);assert.equal(completions,1);projection.close();device.close();
}
const pending=createTandyChipPcmProjection(48000,3579545,0);pending.record(1,1);const before=pending.snapshot();assert.throws(()=>pending.render(2,0),/does not cover/);assert.deepEqual(pending.snapshot(),before);
pending.render(1,0);pending.record(2,0.5);assert.throws(()=>pending.record(0,1),/Invalid/);assert.deepEqual([...pending.render(1,100)],[0.5]);pending.close();
assert.throws(()=>createTandyChipPcmProjection(48000,3579545,1e100),/Invalid/);
console.log('Chip events project held PCM at exact output sample positions across rates/splits; same-tick event order retained, uncovered output and past-event writes rejected without invented hardware progress');
