import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {readOriginalCarSoundResources} from '../lib/game/read-car-sound-resources.ts';
const bytes=readFileSync('public/game/replays/CTKFIN.RPL');let banks=0;
for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const car of ['ANSX','AUDI','COUN','FGTO','JAGU','LANC','LM02','P962','PC04','PMIN','VETT']){
 const configuration=Array.from(bytes.subarray(0,24));configuration.splice(0,4,...Array.from(car,c=>c.charCodeAt(0)));
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:{kind:'pc-speaker',port61:()=>0}},{configuration,track:Array.from(bytes.subarray(24,0x722)),name:'PCMasks',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer),handle=v.getUint16(d+0x8016,true),resources=readOriginalCarSoundResources(memory,d,[handle]);
 assert.equal(resources.length,9);
 for(const resource of resources){const mask=resource.instrument[12]|resource.instrument[13]<<8;assert.equal(mask&1,0,`${physicsEngine}/${car}: supplied PC instrument must not request sample slot`);banks++;}
 runtime.audio.start(handle);runtime.audio.crash(handle);
 for(let i=0;i<200;i++)runtime.audio.tick();
 assert.equal(memory[d+0x4e6a],0);
}
assert.equal(banks,198);
console.log('All11 cars/both releases:198 supplied PC instruments exclude sample slot;4400 actual allocated engine/crash callbacks pass silently');
