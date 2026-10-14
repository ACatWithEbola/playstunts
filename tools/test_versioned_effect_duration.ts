import assert from 'node:assert/strict';
import {stepEffectRuntime} from '../lib/game/effect-runtime.ts';
import {stepOriginalMt32VoiceTimer} from '../lib/game/mt32-voice-timer.ts';
import {stepOriginalPcSpeakerVoiceTimer} from '../lib/game/pc-speaker-voice-timer.ts';
import {stepOriginalTandyVoiceTimer} from '../lib/game/tandy-voice-timer.ts';
import {readFileSync} from 'node:fs';
import {stepOriginalMt32Effects} from '../lib/game/mt32-effect-runtime.ts';
import {stepOriginalPcSpeakerEffects} from '../lib/game/pc-speaker-effect-runtime.ts';
import {stepOriginalTandyEffects} from '../lib/game/tandy-effect-runtime.ts';
for(const effectEngine of [undefined,'ms-1990','ms-1991'] as const){
 const timers=Array.from({length:24},()=>new Uint8Array(72)),voices=[new Uint8Array(46),new Uint8Array(46)];
 const voice=voices[1],view=new DataView(voice.buffer);voice[0]=16;voice[1]=1;voice[44]=2;
 view.setUint16(16,0x100,true);view.setUint16(18,0x9000,true);view.setUint16(42,0x801e+16*72,true);
 const before={timers,voices,lastNotes:new Uint8Array(24),velocities:Array(9).fill(127),driverSegment:0x39e1,driverGeneration:'ms-1990' as const,effectEngine};
 const source=voice.slice();
 const result=stepEffectRuntime(before,[{instrumentOffset:0x100,instrumentSegment:0x9000,instrument:new Uint8Array(100),headerOffset:0,headerSegment:0,header:new Uint8Array(),sequenceOffset:0,sequenceSegment:0,sequence:new Uint8Array()}]);
 assert.equal(new DataView(result.voices[1].buffer).getUint32(12,true),effectEngine==='ms-1991'?0:4294967295);
 assert.deepEqual(voice,source);assert.equal(result.effectEngine,effectEngine);
 const expected=effectEngine==='ms-1991'?0:4294967295;
 const instrument=()=>new Uint8Array(100);
 const mt=stepOriginalMt32VoiceTimer({...before,voices:[...voices,...Array.from({length:14},()=>new Uint8Array(46))]},instrument,'ms-1990',effectEngine);
 assert.equal(new DataView(mt.voices[1].buffer).getUint32(12,true),expected);
 const pcDriver=Uint8Array.from(JSON.parse(readFileSync('public/game/pc-music-titl-seed.json','utf8')).driver);
 const pc=stepOriginalPcSpeakerVoiceTimer({...before,physicsEngine:'ms-1990',driver:pcDriver},instrument,0);
 assert.equal(new DataView(pc.voices[1].buffer).getUint32(12,true),expected);
 const tdDriver=Uint8Array.from(JSON.parse(readFileSync('public/game/tandy-music-titl-seed.json','utf8')).driver);
 const td=stepOriginalTandyVoiceTimer({...before,driver:tdDriver,cx:0},instrument,0x39e1,0);
 assert.equal(new DataView(td.voices[1].buffer).getUint32(12,true),expected);
 assert.equal(pc.effectEngine,effectEngine);assert.equal(td.effectEngine,effectEngine);
 const resources=[{instrumentOffset:0x100,instrumentSegment:0x9000,instrument:new Uint8Array(100),headerOffset:0,headerSegment:0,header:new Uint8Array(),sequenceOffset:0,sequenceSegment:0,sequence:new Uint8Array()}];
 const mtEffect=stepOriginalMt32Effects({...before,physicsEngine:'ms-1990',driver:new Uint8Array(1667),voices:[...voices,...Array.from({length:14},()=>new Uint8Array(46))]},resources);
 const pcEffect=stepOriginalPcSpeakerEffects({...before,physicsEngine:'ms-1990',driver:pcDriver},resources,0);
 const tdEffect=stepOriginalTandyEffects({...before,driver:tdDriver},resources,0,0x39e1,0);
 for(const next of [mtEffect,pcEffect,tdEffect]){
  assert.equal(next.effectEngine,effectEngine);
  assert.equal(new DataView(next.voices[1].buffer).getUint32(12,true),expected);
 }
}
console.log('All four voice timers follow explicit effect engine independently of retained legacy driver; untagged legacy and input bytes preserved');
