/** Bounded callbacks. Independent original trace must declare five-clock
 * polling. Retained null-memory fixture is not proof of original DOS memory. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOriginalMt32MusicRuntime} from '../lib/game/mt32-music-runtime.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
import {createMt32MusicWriteProgram} from '../lib/game/mt32-music-write-program.ts';
import {createMt32ExecutionClock} from '../lib/game/mt32-execution-clock.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {advanceRetainedMenuClock} from '../lib/game/retained-menu-clock.ts';
const path=process.argv[2];if(!path)throw Error('Provide original five-clock opening trace');
const callbacks=Number(process.argv[3]??1);assert.ok(Number.isSafeInteger(callbacks)&&callbacks>=1&&callbacks<=6000);
const rows=JSON.parse(readFileSync(path,'utf8')) as {engine:string;device:string;name:string;actualModernMt15Executed:boolean;virtualPollPolicy:{pit:number;mpu:number};openingMidiPitTrace:number[][];openingCallbackPitClocks:number;nullInstrumentMemoryExplicitlySeeded?:boolean;openingTicksExecuted:number;installedVoiceCountExplicitlySeeded?:number;laterDispatchPolicy:string;outerIrqExecuted?:boolean;callbackRegistrationExplicitlySeeded?:boolean;hardwareCounters?:number[];finalVoiceRecords?:number[][];nestedIrqInjection?:boolean;nestedIrqFixture?:{delivered:number;policy:string;physicalInstructionLatencyModeled:boolean}}[];
let outerCases=0,nestedCases=0,terminalVoiceCases=0;
for(const name of ['titl','slct','vict','over']){
 const matches=rows.filter(row=>row.engine==='ms-1991'&&row.device==='MT'&&row.name===name.toUpperCase());assert.equal(matches.length,1);
 const original=matches[0];assert.equal(original.actualModernMt15Executed,true);assert.deepEqual(original.virtualPollPolicy,{pit:5,mpu:5});
 assert.equal(original.openingTicksExecuted,callbacks);
 if(callbacks>1){assert.equal(original.installedVoiceCountExplicitlySeeded,16);assert.equal(original.laterDispatchPolicy,'next11932clockBoundaryAfterReturn');}
 if(original.outerIrqExecuted){
  outerCases++;assert.equal(original.callbackRegistrationExplicitlySeeded,true);
  let nested=0;
  if(original.nestedIrqInjection){nestedCases++;assert.equal(original.nestedIrqFixture?.policy,'virtualPITCrossingsSinglePICPendingEdgeWhileIFDisabled');assert.equal(original.nestedIrqFixture?.physicalInstructionLatencyModeled,false);nested=original.nestedIrqFixture!.delivered;assert.ok(Number.isSafeInteger(nested)&&nested>=0);}
  assert.deepEqual(original.hardwareCounters,[callbacks+nested,Math.floor((callbacks+nested)/5)]);
 }
 const seed=versionedMt32MusicSeed(JSON.parse(readFileSync(`public/game/mt32-music-${name}-seed.json`,'utf8')),'ms-1991');
 const runtime=createOriginalMt32MusicRuntime(seed),clock=createMt32ExecutionClock({cpuHz:4772728,pollCycles:20}),trace:number[][]=[];
 const host=createMt32PitTransportHost({async read(port){assert.equal(port,0x331);await clock.poll();return 0;},write(port,byte){assert.equal(port,0x330);trace.push([clock.now(),byte]);},interrupts(){},delay:clock.delay,cancelled:()=>false},{...clock,initialPort61:0});
 for(let i=0;i<callbacks;i++){
  if(callbacks>1)clock.advanceTo((Math.floor(clock.now()/11932)+1)*11932);
  await executeTimedMt32Program(createMt32MusicWriteProgram(runtime.driver,runtime.tick().writes,'ms-1991'),host);
 }
 assert.deepEqual(trace,original.openingMidiPitTrace,`${name}: original callback byte/timestamp parity failed`);
 assert.equal(clock.now(),original.openingCallbackPitClocks);
 if(original.outerIrqExecuted){
  const replacementClock=advanceRetainedMenuClock({callbackCounter:0,gameCounter:0,divisor:5,countdown:5},Math.floor(clock.now()/11932));
  assert.deepEqual([replacementClock.callbackCounter,replacementClock.gameCounter],original.hardwareCounters);
  if(original.finalVoiceRecords){
   terminalVoiceCases++;
   assert.equal(original.finalVoiceRecords.length,16);
   for(let voice=0;voice<16;voice++){
    const normalized:number[]=[...original.finalVoiceRecords[voice]],pointer:number=normalized[42]|normalized[43]<<8;
    if(pointer){const owner=(pointer-0x8678)/76;assert.ok(Number.isInteger(owner)&&owner>=0&&owner<24);const mapped=0x801e+owner*72;normalized[42]=mapped&255;normalized[43]=mapped>>>8;}
    assert.deepEqual(Array.from(runtime.voices[voice]),normalized,`${name}: final voice ${voice} differs after outer/nested IRQs`);
   }
  }
 }
 console.log(`${name}: ${callbacks} callbacks/${trace.length} bytes/timestamps match; ${clock.now()} PIT clocks${original.nullInstrumentMemoryExplicitlySeeded?'; retained null-memory fixture':''}`);
}
console.log(`Four scores match bounded callbacks under declared clock/dispatch policy; original outer IRQ cases=${outerCases}, nested IRQ cases=${nestedCases}, terminal voice cases=${terminalVoiceCases}; registration/voice/null-memory fixtures remain explicit, physical timing and listening not verified`);
