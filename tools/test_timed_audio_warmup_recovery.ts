import assert from 'node:assert/strict';
import {createBrowserTimedMt32Audio} from '../lib/game/browser-timed-mt32-audio.ts';
let now=0,renders=0,delayWarmup=true;const events:{start:number;duration:number;gap:number;frameStart:number;frameEnd:number}[]=[];
const jitterMs=Number(process.argv.find(value=>value.startsWith('--jitter-ms='))?.slice(12)??0);
if(!Number.isFinite(jitterMs)||jitterMs<0||jitterMs>1000)throw Error('Invalid bounded refill jitter');
const context={get currentTime(){return now;},state:'running',destination:{},
 createGain(){return {gain:{value:1},connect(){},disconnect(){}};},
 createBuffer(){return {getChannelData:()=>new Float32Array(512)};},
 createBufferSource(){return {buffer:null,onended:null,connect(){},disconnect(){},start(){},stop(){}};}
} as unknown as AudioContext;
const audio=createBrowserTimedMt32Audio(context,{sampleRate:32000,async render(){renders++;if(delayWarmup){now+=.2;delayWarmup=false;}return new Float32Array(1024);}},()=>true,event=>events.push(event),4);
await audio.pump();
assert.equal(events[0].start,now+.015,'Larger runway must not delay the first audible block');
assert.ok(events.at(-1)!.start+events.at(-1)!.duration-now>=.025,'Delayed warmup must leave enough queued audio to reach the next25ms refill');
now+=.025+jitterMs/1000;await audio.pump();
if(events.some(event=>event.gap>0))console.log(JSON.stringify({jitterMs,events,scope:'Synthetic callback delay; not original MIDI/CPU defect proof'}));
assert.ok(events.every(event=>event.gap===0),'Next refill must remain contiguous after delayed warmup');
for(let refill=0;refill<40;refill++){
 now+=.025+jitterMs/1000;await audio.pump();
 assert.ok(events.every(event=>event.gap===0),'Repeated delayed callbacks must remain contiguous');
}
assert.ok(events.length>=4,'Retained warmup blocks are actually submitted');
for(let index=0;index<events.length;index++){assert.equal(events[index].frameStart,index*512);assert.equal(events[index].frameEnd,(index+1)*512);}
const lastFrame=events.at(-1)!.frameEnd;audio.suspend();now+=5;delayWarmup=true;events.length=0;audio.resume();
await audio.pump();assert.ok(events[0].frameStart>=lastFrame,'Resume cannot reuse previously submitted PCM');
now+=.025+jitterMs/1000;await audio.pump();assert.ok(events.every(event=>event.gap===0),'Reset timeline recovers the same initial runway after pause');
for(let index=1;index<events.length;index++)assert.equal(events[index].frameStart,events[index-1].frameEnd);
audio.close();console.log('Delayed warmup recovers bounded playback runway without an avoidable refill gap; synthetic WebAudio');
