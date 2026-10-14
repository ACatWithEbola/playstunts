import assert from 'node:assert/strict';
import {rebindNativeSoundPort} from '../lib/game/rebind-native-sound-port.ts';
import type {NativeRaceSoundDevice} from '../lib/game/native-race-sound-device.ts';
let port=0x40;const originalPort=()=>0x20,sampleIo={interruptMask:()=>0xa5};
const pc:NativeRaceSoundDevice={kind:'pc-speaker',port61:originalPort,sampleIo};
const bound=rebindNativeSoundPort(pc,()=>port);
assert.equal(bound?.kind,'pc-speaker');
if(bound?.kind!=='pc-speaker')throw Error('Wrong device');
assert.equal(bound.sampleIo,sampleIo);assert.equal(bound.sampleIo?.interruptMask(),0xa5);
assert.equal(bound.port61(),0x40);port=0x80;assert.equal(bound.port61(),0x80);
assert.equal(pc.port61,originalPort);
for(const generation of ['ms-1990','ms-1991'] as const){
 const tandy:NativeRaceSoundDevice={kind:'tandy',driverGeneration:generation,port61:originalPort,interruptCx:()=>7,bios(){},sampleStarts(){}};
 const next=rebindNativeSoundPort(tandy,()=>port);
 assert.equal(next?.kind,'tandy');if(next?.kind!=='tandy')throw Error('Wrong Tandy device');
 assert.equal(next.driverGeneration,generation);assert.equal(next.bios,tandy.bios);assert.equal(next.sampleStarts,tandy.sampleStarts);assert.equal(next.interruptCx,tandy.interruptCx);
}
const adlib:NativeRaceSoundDevice={kind:'adlib',driverGeneration:'ms-1991'};
assert.equal(rebindNativeSoundPort(adlib,()=>port),adlib);
assert.equal(rebindNativeSoundPort(undefined,()=>port),undefined);
console.log('Browser port rebinding retains PC sample I/O, both Tandy identities and callbacks without mutating source devices');
