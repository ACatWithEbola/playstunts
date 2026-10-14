import assert from 'node:assert/strict';
import {createLegacyTandyChipDevice} from '../lib/game/legacy-tandy-chip-device.ts';
for(const cross of [false,true]){
 const bytes:number[][]=[],completions:number[]=[];
 const request={ax:0x8307,es:cross?0x3fff:0,bx:cross?15:0,cx:2,dx:1};
 const device=createLegacyTandyChipDevice(address=>address&255,{divisor:1,volume:0,grant:()=>true,byte:(tick,value,volume)=>bytes.push([tick,value,volume]),completion(ax,tick){assert.equal(ax,0x91fb);completions.push(tick);if(completions.length===1)assert.equal(device.play(request).carry,false);}});
 const before=device.snapshot();assert.throws(()=>device.play({...request,dx:0}),/Invalid/);assert.deepEqual(device.snapshot(),before);
 device.play({ax:0x8300,es:0,bx:0,cx:1,dx:1});const active=device.snapshot();assert.equal(device.play(request).carry,true);assert.deepEqual(device.snapshot(),active);device.advance(1);
 assert.equal(device.status().carry,false);assert.deepEqual(bytes,[[1,0,0]]);
 assert.equal(device.serviceInterrupt(false),false);assert.deepEqual(device.snapshot().pending,['completion']);
 assert.equal(device.serviceInterrupt(true),true);assert.equal(device.status().carry,true);
 device.advance(2);
 if(cross){assert.equal(device.status().carry,true);assert.deepEqual(device.snapshot().pending,['segment']);assert.equal(bytes.length,2);device.serviceInterrupt(true);device.advance(1);}
 assert.equal(device.status().carry,false);assert.deepEqual(device.snapshot().pending,['completion']);
 device.serviceInterrupt(true);assert.equal(completions.length,2);assert.equal(device.serviceInterrupt(true),false);
 assert.equal(bytes.length,3);device.close();assert.throws(()=>device.advance(1),/unavailable/);
}
let reads=0;
const closed=createLegacyTandyChipDevice(()=>{reads++;return 128;},{divisor:1,volume:7,grant:()=>true,byte(){closed.close();},completion(){throw Error('Closed device must not notify');}});
closed.play({ax:0x8307,es:0,bx:0,cx:2,dx:1});assert.throws(()=>closed.advance(10),/unavailable/);assert.equal(reads,1);
console.log('Fine chip device retains masked completion, restarts from enabled callback, holds64KiB segment busy until service and stops reads after close; CPU/BIOS windows explicit');
