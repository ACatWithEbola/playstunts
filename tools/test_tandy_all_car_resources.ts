import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {readOriginalCarSoundResources} from '../lib/game/read-car-sound-resources.ts';
import {serviceSuppliedTandySilentRequests} from '../lib/game/supplied-tandy-bios.ts';
import {soundResourceOffset} from '../lib/game/sound-resource.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');let banks=0;
for(const driverGeneration of ['ms-1990','ms-1991'] as const)for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const car of ['ANSX','AUDI','COUN','FGTO','JAGU','LANC','LM02','P962','PC04','PMIN','VETT']){
 const configuration=Array.from(bytes.subarray(0,24));configuration.splice(0,4,...Array.from(car,c=>c.charCodeAt(0)));
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:{kind:'tandy',driverGeneration,port61:()=>0,interruptCx:()=>0,bios(requests,memory){if(driverGeneration==='ms-1991')assert.equal(requests.length,0,'modern supplied path must not submit legacy BIOS requests');else serviceSuppliedTandySilentRequests(requests,memory);}}},{configuration,track:Array.from(bytes.subarray(24,0x722)),name:'TDMasks',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer),handle=v.getUint16(d+0x8016,true),resources=readOriginalCarSoundResources(memory,d,[handle]);
 assert.equal(resources.length,9);
 for(const resource of resources){const mask=resource.instrument[12]|resource.instrument[13]<<8;assert.equal(mask&1,0,`${physicsEngine}/${car}: shipped Tandy instrument must not allocate DAC channel`);banks++;}
 runtime.audio.start(handle);runtime.audio.crash(handle);for(let i=0;i<200;i++)runtime.audio.tick();assert.equal(memory[d+0x4e6a],0);
}
let musicPatches=0;
for(const name of ['titl','slct','vict','over']){
 const seed=JSON.parse(readFileSync(`public/game/tandy-music-${name}-seed.json`,'utf8')),bank=Uint8Array.from(seed.voices);
 const count=bank[4]|bank[5]<<8;
 for(let i=0;i<count;i++){
  const key=bank.slice(6+i*4,10+i*4),at=soundResourceOffset(bank,key)!;
  assert.equal((bank[at+12]|bank[at+13]<<8)&1,0,`${name}/${String.fromCharCode(...key)} must not allocate DAC channel`);musicPatches++;
 }
}
assert.equal(banks,396);
console.log(`Shipped Tandy inventory: ${banks} all-car instruments and ${musicPatches} music patches exclude sample channel;8800 actual allocated callbacks pass across both sound generations and both physics versions`);
