import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createControlledOriginalMt32Music} from '../lib/game/controlled-mt32-music.ts';
import {versionedMt15Resource} from '../lib/game/versioned-mt15-resource.ts';
import {createMt32MusicWriteProgram} from '../lib/game/mt32-music-write-program.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {createMt32AudioStream,createTimedMt32AudioStream} from '../lib/game/mt32-audio-stream.ts';
import {createTimedMt32ScoreStream} from '../lib/game/timed-mt32-score-stream.ts';
function device(){let value=0;const writes:number[][]=[];return {sampleRate:32000,writes,write(values:number[][]){writes.push(...values);value=values.at(-1)?.[1]??value;},render(frames:number){return new Float32Array(frames*2).fill(value/255);}};}
for(const score of ['titl','slct','vict','over'])for(const generation of ['ms-1990','ms-1991'] as const){
 const path=`public/game/mt32-music-${score}-seed.json`,source=readFileSync(path,'utf8'),seed=JSON.parse(source);seed.driverGeneration=generation;
 const resource=versionedMt15Resource(generation);if(resource)seed.driver=Array.from(resource);
 const plain=createControlledOriginalMt32Music(structuredClone(seed)),timed=createControlledOriginalMt32Music(structuredClone(seed)),a=device(),b=device();let clocks=0;
 const host=createMt32PitTransportHost({read:()=>0,write:(port,value)=>b.write([[port,value]]),interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>clocks,async poll(){clocks+=97;}});
 const deliver=async(writes:number[][])=>{assert.equal(await executeTimedMt32Program(createMt32MusicWriteProgram(timed.runtime.driver,writes,generation),host),0);};
 const expected=createMt32AudioStream(a,()=>plain.tick().writes).render(32000);
 const stream=createTimedMt32AudioStream(b,async()=>{await timed.tickTimed({write:deliver});return [];});
 assert.deepEqual(await stream.render(32000),expected,'Awaited transfers preserve IRQ sample ordering');
 assert.deepEqual(b.writes,a.writes,'Full shipped score MIDI trace unchanged by transport pacing');
 assert.deepEqual(timed.runtime.timers,plain.runtime.timers);assert.deepEqual(timed.runtime.voices,plain.runtime.voices);
 if(generation==='ms-1991')assert.ok(clocks>0,'Modern shipped score instruments require timed packets');else assert.equal(clocks,0);
 assert.equal(readFileSync(path,'utf8'),source);
 const c=device();let scoreClock=0;
 const scoreHost=createMt32PitTransportHost({read:()=>0,write:(port,value)=>c.write([[port,value]]),interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>scoreClock,async poll(){scoreClock+=97;}});
 const owned=await createTimedMt32ScoreStream(structuredClone(seed),c,scoreHost);
 const reference=device(),referenceMusic=createControlledOriginalMt32Music(structuredClone(seed));reference.write(seed.initialWrites);
 const referenceStream=createMt32AudioStream(reference,()=>referenceMusic.tick().writes);
 assert.deepEqual(await owned.render(32000),referenceStream.render(32000));
 assert.deepEqual(c.writes,reference.writes,'Owned score sends initialization and callback bytes through the selected transport');
 await owned.control('pause-audio');assert.equal(owned.settings.paused,1);
 await owned.control('resume-audio');assert.equal(owned.settings.paused,0);
 owned.close();assert.throws(()=>owned.render(512),/cancelled/);
}
console.log('Eight shipped Roland score chains pass actual callbacks, queued ticks, timed MIDI/PIT bridge and async stream with exact logical PCM/MIDI traces; synthetic device/virtual clocks, not browser synthesis');
