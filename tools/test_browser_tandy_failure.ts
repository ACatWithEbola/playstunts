import assert from 'node:assert/strict';
import {createBrowserTandyRaceAudio} from '../lib/game/browser-tandy-race-audio.ts';
function fixture(){let disconnected=0;const sources:any[]=[];
 const context={sampleRate:48000,currentTime:0,state:'running',destination:{},
  createGain:()=>({gain:{value:0},connect(){},disconnect(){disconnected++;}}),
  createBuffer:()=>({copyToChannel(){}}),createBufferSource(){const source={buffer:null as unknown,onended:null as unknown,stopped:0,disconnected:0,connect(){},start(){},stop(){this.stopped++;},disconnect(){this.disconnected++;}};sources.push(source);return source;}};
 return {context:context as unknown as AudioContext,sources,get disconnected(){return disconnected;}};
}
const startup=fixture();assert.throws(()=>createBrowserTandyRaceAudio(startup.context,[[0xc4,1]],()=>[]),/sample hardware scheduler/);assert.equal(startup.disconnected,1);
const running=fixture();let ticks=0;
const audio=createBrowserTandyRaceAudio(running.context,[],()=>{ticks++;return ticks===1?[]:[[0xc4,1]];});
assert.throws(()=>audio.pump(),/sample hardware scheduler/);assert.ok(running.sources.length>0);
assert.ok(running.sources.every(s=>s.stopped===1&&s.disconnected===1&&s.buffer===null));assert.equal(running.disconnected,1);
const before=ticks;audio.pump();audio.write([]);audio.close();assert.equal(ticks,before);assert.equal(running.disconnected,1);
const writes=fixture();const explicit=createBrowserTandyRaceAudio(writes.context,[],()=>[]);explicit.pump();
assert.throws(()=>explicit.write([[0xc4,1]]),/sample hardware scheduler/);assert.ok(writes.sources.every(s=>s.buffer===null));assert.equal(writes.disconnected,1);
console.log('Tandy browser failures release startup gain and queued sources, close idempotently and stop future pumps; fake Web Audio only');
const custom=fixture();let rendered=0;const initial:number[][]=[];
const delegated=createBrowserTandyRaceAudio(custom.context,[[0xc4,3]],()=>{assert.fail('Supplied backend owns IRQ dispatch');return [];},
 {sampleRate:48000,port61:17,write(writes){initial.push(...writes);},render(frames){rendered+=frames;return new Float32Array(frames).fill(0.25);}});
assert.deepEqual(initial,[[0xc4,3]]);assert.equal(delegated.port61,17);delegated.pump();assert.ok(rendered>0);delegated.close();
const malformed=fixture();const invalid=createBrowserTandyRaceAudio(malformed.context,[],()=>[],{sampleRate:48000,port61:0,write(){},render(){return new Float32Array(1);}});
assert.throws(()=>invalid.pump(),/backend audio buffer/);assert.equal(malformed.disconnected,1);
assert.throws(()=>createBrowserTandyRaceAudio(fixture().context,[],()=>[],{sampleRate:32000,port61:0,write(){},render(){return new Float32Array(512);}}),/sample rate mismatch/);
