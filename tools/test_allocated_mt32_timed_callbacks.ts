/** Actual allocated car callbacks through timed packet delivery. Startup uses
 * declared virtual read responses; not full IRQ/browser/original-PC proof. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fixtureData} from './global-score-fixture.ts';
import {createNativeManualRaceRuntime} from '../lib/game/native-manual-race-runtime.ts';
import {readOriginalMt32RaceState} from '../lib/game/mt32-race-audio-memory.ts';
import {createMt32MusicWriteProgram} from '../lib/game/mt32-music-write-program.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import type {OriginalMt32MpuProgram} from '../lib/game/mt32-transport.ts';
const replay=readFileSync('public/game/replays/CTKFIN.RPL'),unchanged=Buffer.from(replay);let cases=0,callbacks=0;
function virtual(program:OriginalMt32MpuProgram){const writes:number[][]=[];let step=program.next();while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}return {result:step.value,writes};}
for(const driverGeneration of ['ms-1990','ms-1991'] as const)for(const physicsEngine of ['ms-1990','ms-1991'] as const)for(const car of ['ANSX','AUDI','COUN','FGTO','JAGU','LANC','LM02','P962','PC04','PMIN','VETT']){
 const configuration=Array.from(replay.subarray(0,24));configuration.splice(0,4,...Array.from(car,c=>c.charCodeAt(0)));
 const runtime=await createNativeManualRaceRuntime({...fixtureData,physicsEngine,soundDevice:{kind:'mt32',driverGeneration,execute:virtual}},{configuration,track:Array.from(replay.subarray(24,0x722)),name:'MTTIMED',camera:0,graphics:2,soundEnabled:true},{resetMouse(){}});
 const memory=runtime.session.state.memory,d=0x2d1a0,v=new DataView(memory.buffer),handle=v.getUint16(d+0x8016,true);
 let clocks=0,packets=0;
 const deliver=async(writes:number[][])=>{
  const actual:number[][]=[],driver=readOriginalMt32RaceState(memory,d,0x39e1,driverGeneration).driver;
  const host=createMt32PitTransportHost({read:()=>0,write:(port,value)=>{actual.push([port,value]);},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>clocks,async poll(){clocks++;}});
  await executeTimedMt32Program(createMt32MusicWriteProgram(driver,writes,driverGeneration),host);
  assert.deepEqual(actual.filter(([port])=>port===0x330),writes,`${driverGeneration}/${physicsEngine}/${car}: callback MIDI order changed`);
  packets+=writes.filter(([,byte])=>byte===0xf0).length;callbacks++;
 };
 await deliver(runtime.audio.start(handle));await deliver(runtime.audio.crash(handle));
 for(let tick=0;tick<20;tick++)await deliver(runtime.audio.tick());
 assert.equal(clocks>0,driverGeneration==='ms-1991');assert.equal(packets>0,driverGeneration==='ms-1991');
 assert.equal(clocks,packets*(4*201+32501),'Each modern instrument packet retains every declared PIT wait');
 assert.equal(v.getUint16(d+0x4e6a,true),0);cases++;
}
assert.deepEqual(readFileSync('public/game/replays/CTKFIN.RPL'),unchanged);
console.log(`${cases} allocated car/driver/physics combinations and ${callbacks} callbacks retain exact MIDI through versioned timed delivery; virtual startup/polling, not original hardware/browser proof`);
