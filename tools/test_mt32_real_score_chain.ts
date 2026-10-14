import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import createMunt from '../public/game/mt32-local/munt.mjs';
import {createMt32WasmOutput,type Mt32Wasm} from '../lib/game/mt32-wasm-output.ts';
import {createPacedMt32Output} from '../lib/game/paced-mt32-output.ts';
import {createControlledOriginalMt32Music} from '../lib/game/controlled-mt32-music.ts';
import {versionedMt32MusicSeed} from '../lib/game/versioned-mt32-music-seed.ts';
import {createMt32MusicWriteProgram} from '../lib/game/mt32-music-write-program.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {ORIGINAL_PIT_DIVISOR,PC_PIT_INPUT_HZ} from '../lib/game/timer-interrupt.ts';
import {executeMt32StartupPrograms} from '../lib/game/mt32-startup-programs.ts';
const control=readFileSync('public/game/mt32-local/ctrl_mt32_1_07.rom'),pcm=readFileSync('public/game/mt32-local/pcm_mt32.rom'),wasm=readFileSync('public/game/mt32-local/munt.wasm');
const startup=process.argv.includes('--startup'),patch=readFileSync('public/game/original-resources/MT32.PLB');
for(const generation of ['ms-1990','ms-1991'] as const)for(const score of ['titl','slct','vict','over']){
 const path=`public/game/mt32-music-${score}-seed.json`,source=readFileSync(path,'utf8'),seed=versionedMt32MusicSeed(JSON.parse(source),generation);
 let stage='open',recentBytes:number[]=[],rendered=0;
 const diagnostics:{message:string;stage:string;frame:number;bytes:number[]}[]=[];
 const report=(message:string)=>diagnostics.push({message,stage,frame:rendered,bytes:recentBytes.slice()});
 const module=await createMunt({wasmBinary:wasm,print:report,printErr:report}),device=createMt32WasmOutput(module as unknown as Mt32Wasm,control,pcm);
 try{
  if(startup){
   // Prime a non-default system volume, then verify startup actively restores
   // it. Munt readMemory uses packed seven-bit address coordinates.
   assert.ok(device.prepare,'Actual synthesizer adapter must provide preparation');
   device.prepare([0xf0,0x41,0x10,0x16,0x12,0x10,0,0x16,0,0x5a,0xf7].map(byte=>[0x330,byte]));
   assert.equal(device.read(0x40016,1)[0],0,'Non-default volume priming must reach actual synthesizer memory');
  }
  const output=createPacedMt32Output({sampleRate:device.sampleRate,write(writes){stage='MIDI delivery';recentBytes.push(...writes.filter(([port])=>port===0x330).map(([,value])=>value));recentBytes=recentBytes.slice(-32);device.write(writes);},render(frames){stage='synthesis';const samples=device.render(frames);rendered+=frames;return samples;}}),music=createControlledOriginalMt32Music(seed);let clock=0,nonzero=0;
  const host=createMt32PitTransportHost({read:port=>port===0x330?0xfe:0,write:(port,value)=>{if(port===0x330)output.schedule(clock,[[port,value]]);},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>clock,async poll(){clock++;}});
  const trace:number[]=[];
  const deliver=async(writes:number[][])=>{trace.push(...writes.map(([,value])=>value));await executeTimedMt32Program(createMt32MusicWriteProgram(music.runtime.driver,writes,generation),host);};
  // Explicit serialized virtual-host policy. This tests all real score writes,
  // not original interrupt re-entry, CPU cost or browser wall-clock cadence.
  if(startup){
   await executeMt32StartupPrograms(music.runtime.driver,patch,generation,program=>executeTimedMt32Program(program,host));
  }
  const musicOrigin=clock;
  await deliver(seed.initialWrites);
  for(let tick=1;tick<=200;tick++){
   clock=Math.max(clock,musicOrigin+tick*ORIGINAL_PIT_DIVISOR);
   await music.tickTimed({write:deliver});
  }
  const frames=Math.ceil(clock*device.sampleRate/PC_PIT_INPUT_HZ)+device.sampleRate;
  for(let at=0;at<frames;at+=512){const samples=output.render(Math.min(512,frames-at));assert.ok(samples.every(Number.isFinite));nonzero+=samples.filter(value=>value!==0).length;}
  assert.ok(nonzero>0,`${generation}/${score} real score must generate sound`);
  console.log(`${generation}/${score}:startup=${startup},200 actual ticks,${frames} rendered frames,${nonzero} nonzero stereo samples`);
  for(const diagnostic of diagnostics)console.log(`${generation}/${score} diagnostic: ${JSON.stringify({...diagnostic,bytes:diagnostic.bytes.map(byte=>byte.toString(16).padStart(2,'0')).join(' ')})}`);
  if(startup)assert.ok(diagnostics.some(({message})=>message===`WRITE-LCD: ${generation==='ms-1991'?'  (C)1990,1991 DSI  ':'    (C) 1990 DSI    '}`),'Real synthesizer must process the selected original driver display packet');
  if(startup)assert.equal(device.read(0x40016,1)[0],100,'Selected original startup actively restores real synthesizer system volume');
  if(score==='titl'){
   assert.equal(seed.nullInstrument[68],0xe0,'Captured null instrument retains high-bit program value');
   assert.ok(trace.some((byte,index)=>byte===0xc6&&trace[index+1]===seed.nullInstrument[68]),'Title callback itself emits the rejected program value before transport');
   assert.ok(diagnostics.some(({message})=>message.includes('Invalid short message: status c6')),'Keep known title parser warning visible, not a clean MIDI acceptance');
  }
  assert.equal(readFileSync(path,'utf8'),source);
  assert.deepEqual(readFileSync('public/game/original-resources/MT32.PLB'),patch);
 }finally{device.close();}
}
console.log('Eight real Roland shipped-score chains produce finite nonzero output with paced transport; virtual serialized clock policy, no browser/CPU timing acceptance');
