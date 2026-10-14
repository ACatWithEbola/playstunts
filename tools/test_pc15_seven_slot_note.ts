import assert from 'node:assert/strict';
import {pcSpeakerChannelMasks} from '../lib/game/pc-speaker-control.ts';
import {startOriginalPcSpeakerNote} from '../lib/game/pc-speaker-note-start.ts';
for(const engine of ['ms-1990','ms-1991'] as const){
 const masks=pcSpeakerChannelMasks(engine),voices=masks.map(()=>{const v=new Uint8Array(46);v[0]=255;return v;}),timers=Array.from({length:24},(_,owner)=>{const t=new Uint8Array(72);t[0x16]=15;t[0x23]=owner;t[0x28]=127;return t;});
 new DataView(timers[16].buffer).setUint32(0x1e,0x90000100,true);
 const instrument=new Uint8Array(100);new DataView(instrument.buffer).setUint16(12,96,true);
 const command=new Uint8Array(10);command[4]=60;command[5]=100;new DataView(command.buffer).setUint32(6,100,true);
 const result=startOriginalPcSpeakerNote({alternate:false,channelMasks:masks,owner:16,instrument,timers,voices,lastNotes:new Uint8Array(24),command},new Uint8Array(0x2e9));
 if(engine==='ms-1991'){assert.ok(result.voice===5||result.voice===6);assert.equal(result.driver[0x1a8+result.voice],255);assert.equal(result.voices[result.voice][0],16);}
 else assert.equal(result.voice,-1,'Legacy must not allocate modern-only mask slots');
}
console.log('Modern mask96 allocates additional PC15 melodic slot; legacy cannot allocate it');
