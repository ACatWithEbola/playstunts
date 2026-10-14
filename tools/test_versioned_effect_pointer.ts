import assert from 'node:assert/strict';
import {startEffect} from '../lib/game/effect-start.ts';
import {impactAudioRuntime} from '../lib/game/impact-audio-runtime.ts';
const header=new Uint8Array(12);header[5]=1;
const timers=Array.from({length:24},()=>new Uint8Array(72));
const input={enabled:true,master:127,volume:100,priority:64,requested:16,headerOffset:100,headerSegment:0x6000,header,timers,busy:Array(24).fill(0),lastNotes:new Uint8Array(24),markers:new Uint8Array(24)};
let checked=0;
for(let offset=0;offset<65536;offset++){
 const raw=(0x1234*65536+offset)>>>0;new DataView(header.buffer).setUint32(8,raw,true);
 for(const physicsEngine of ['ms-1990','ms-1991'] as const){
  const result=startEffect({...input,physicsEngine});
  const expected=physicsEngine==='ms-1991'?0x1234*65536+((offset+4)&65535):(raw+4)>>>0;
  const view=new DataView(result.timers[16].buffer);
  assert.equal(view.getUint32(0,true),expected);assert.equal(view.getUint32(5,true),expected);checked++;
 }
}
for(const segment of [0,0x8000,0xffff])for(const offset of [0xfffb,0xfffc,0xffff]){
 const raw=(segment*65536+offset)>>>0;new DataView(header.buffer).setUint32(8,raw,true);
 const legacy=startEffect({...input,physicsEngine:'ms-1990'}),modern=startEffect({...input,physicsEngine:'ms-1991'});
 assert.deepEqual(startEffect(input),legacy,'Unspecified generation preserves legacy result');
 assert.equal(new DataView(modern.timers[16].buffer).getUint16(2,true),segment);
 assert.equal(new DataView(legacy.timers[16].buffer).getUint32(0,true),(raw+4)>>>0);
}
assert.ok(timers.every(t=>t.every(v=>v===0)),'Caller timer records remain unchanged');
assert.ok(input.lastNotes.every(v=>v===0)&&input.markers.every(v=>v===0));
for(let count=0;count<256;count++){
 const largeHeader=new Uint8Array(4*count+12);largeHeader[5]=1;largeHeader[6]=count;
 new DataView(largeHeader.buffer).setUint32(4*count+8,0x12345678,true);
 const modern=startEffect({...input,header:largeHeader,physicsEngine:'ms-1991'});
 assert.equal(new DataView(modern.timers[16].buffer).getUint32(0,true),0x1234567c);
 if(count<128)assert.deepEqual(startEffect({...input,header:largeHeader}),modern);
 else assert.throws(()=>startEffect({...input,header:largeHeader}),/Unreconstructed effect header layout/,'Legacy signed-count unsupported range remains rejected');
}
const invalid={...input,headerOffset:0,headerSegment:0,requested:99};
assert.equal(startEffect({...invalid,physicsEngine:'ms-1991'}).voice,-1,'Modern invalid resource rejects before voice selection');
assert.throws(()=>startEffect({...invalid,physicsEngine:'ms-1990'}),/Unsupported explicit effect voice/,'Legacy selection ordering unchanged');
assert.throws(()=>startEffect({...input,header:Uint8Array.from([0,0,0,0,0,1,255]),physicsEngine:'ms-1991'}),/Unreconstructed/,'Truncated unsigned-count resource remains rejected');
new DataView(header.buffer).setUint32(8,0x1234fffe,true);
const car=new Uint8Array(76),carView=new DataView(car.buffer);
carView.setUint16(0x48,input.headerOffset,true);carView.setUint16(0x4a,input.headerSegment,true);
const resource={headerOffset:input.headerOffset,headerSegment:input.headerSegment,header,instrumentOffset:0,instrumentSegment:0,instrument:new Uint8Array(),sequenceOffset:0,sequenceSegment:0,sequence:new Uint8Array()};
for(const effectEngine of ['ms-1990','ms-1991'] as const){
 const physicsEngine=effectEngine==='ms-1990'?'ms-1991':'ms-1990';
 const started=impactAudioRuntime({...input,car,voices:[],effectEngine,physicsEngine},0x10,true,[resource],true,127);
 const handle=new DataView(started.car.buffer).getUint16(20,true);
 assert.equal(new DataView(started.timers[handle].buffer).getUint32(0,true),effectEngine==='ms-1991'?0x12340002:0x12350002,'Core effect generation overrides independent driver generation');
 assert.equal(started.physicsEngine,physicsEngine,'Driver generation retained');
}
console.log(`PASS ${checked} actual effect starts across every offset in both versions; segment boundaries and legacy default preserved`);
const extended=Array.from({length:24},()=>new Uint8Array(76).fill(0xaa));
const full=startEffect({...input,timers:extended,physicsEngine:'ms-1991'});
assert.deepEqual(Array.from(full.timers[16].slice(72)),[0,0,0,0]);
assert.ok(full.timers[17].every(v=>v===0xaa),'Other extended records preserved');
assert.ok(extended.every(t=>t.every(v=>v===0xaa)),'Input extended records untouched');
assert.throws(()=>startEffect({...input,timers:extended,physicsEngine:'ms-1990'}),/Invalid original effect timer pool/);
assert.throws(()=>startEffect({...input,timers:extended.map((t,i)=>i===0?t.slice(0,72):t),physicsEngine:'ms-1991'}),/Invalid original effect timer pool/,'Mixed timer strides rejected');
