import assert from 'node:assert/strict';
import {createLegacyTandyChipTimeline} from '../lib/game/legacy-tandy-chip-timeline.ts';
import {createOriginalTandyDacTransfer} from '../lib/game/tandy-dac-transfer.ts';
function fixture(){
 const events:number[][]=[];const transfer=createOriginalTandyDacTransfer(address=>{events.push([0,address]);return 128;});
 const timeline=createLegacyTandyChipTimeline(1,0,tick=>{
  const byte=transfer.transferByte();if(!byte)return;events.push([tick,byte.completion??0]);
  // Explicit callback window supplied by fixture. Models repeat programming,
  // not an inferred CPU completion-service delay.
  if(tick===1){assert.equal(transfer.play({ax:0x8307,es:0,bx:2,cx:2,dx:3}).carry,false);timeline.program(3,7);}
 });
 transfer.play({ax:0x8300,es:0,bx:0,cx:1,dx:1});
 return {timeline,events,transfer};
}
const whole=fixture(),split=fixture();whole.timeline.advance(10);for(const clocks of [1,2,1,3,3])split.timeline.advance(clocks);
assert.deepEqual(whole.events,[[0,0],[1,0x91fb],[0,2],[4,0],[0,3],[7,0x91fb]]);
assert.deepEqual(split.events,whole.events);assert.deepEqual(split.timeline.snapshot(),whole.timeline.snapshot());
assert.equal(whole.transfer.status().carry,false);
let calls=0;
const owner=createLegacyTandyChipTimeline(1,7,()=>{calls++;assert.throws(()=>owner.advance(1),/Invalid/);owner.close();});
assert.throws(()=>owner.advance(100),/unavailable/);assert.equal(calls,1);assert.throws(()=>owner.advance(1),/unavailable/);
const valid=createLegacyTandyChipTimeline(3,7,()=>{}),before=valid.snapshot();assert.throws(()=>valid.advance(-1),/Invalid/);assert.deepEqual(valid.snapshot(),before);
for(const fixture of [whole,split])fixture.timeline.close();valid.close();
console.log('Fine chip timeline distinguishes silent completion/reprogram/next bytes within one audio frame, preserves whole/split events and rejects reentry/closed delivery; CPU windows explicit');
