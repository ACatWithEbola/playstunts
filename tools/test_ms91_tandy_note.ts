import assert from 'node:assert/strict';
import {versionedTd15Resource} from '../lib/game/versioned-td15-resource.ts';
import {startMs91TandyNote} from '../lib/game/ms91-tandy-note.ts';
import {startOriginalTandyAllocatedNote} from '../lib/game/tandy-note-start.ts';
import {stepOriginalTandyEffects,runOriginalTandyEffects} from '../lib/game/tandy-effect-runtime.ts';
let cases=0;
for(let channel=0;channel<6;channel++)for(let note=0;note<256;note++){
 const driver=versionedTd15Resource('ms-1991')!,original=driver.slice(),voice=new Uint8Array(46).fill(17),instrument=new Uint8Array(96);instrument[0x15]=1;
 assert.equal(startMs91TandyNote(driver,channel,voice,instrument,note,80,3,1234),undefined);
 assert.equal(voice[3],note);const cx=note===255?3:channel;assert.equal(driver[0x5a9+cx],original[0x567+10]);
 if(note===255)assert.equal(voice[4]|voice[5]<<8,0x1111);
 else{
  const table=channel===0?0x497:channel<=3?0x3a7:channel===4?0x557:0x23f,index=channel===4?(note*2)&15:note*2;
  assert.equal(voice[4]|voice[5]<<8,original[table+index]|original[table+index+1]<<8);
 }
 cases++;
}
for(const type of [0,6]){
 const driver=versionedTd15Resource('ms-1991')!,voice=new Uint8Array(46),instrument=new Uint8Array(96),v=new DataView(instrument.buffer);instrument[10]=1;instrument[5]=type;v.setUint16(6,0x100,true);v.setUint16(8,0x3000,true);
 const frequency=driver[0x32f+10]|driver[0x32f+11]<<8;
 assert.deepEqual(startMs91TandyNote(driver,0,voice,instrument,5,127,0,0),{channel:0,offset:0x100,segment:0x3000,frequency,repeats:type===6?0:1});
 assert.equal(voice[4]|voice[5]<<8,frequency);
}
assert.throws(()=>startMs91TandyNote(new Uint8Array(2993),0,new Uint8Array(46),new Uint8Array(96),1,1,0,0));
console.log(`Modern Tandy note: ${cases} channel/note cases,noise index wrap,noteFF retained pitch/CX,velocity and explicit raw/differential sample requests pass`);
for(const type of [0,6]){
 const driver=versionedTd15Resource('ms-1991')!,instrument=new Uint8Array(96),iv=new DataView(instrument.buffer);
 instrument[10]=1;instrument[5]=type;iv.setUint16(6,0x100,true);iv.setUint16(8,0x3000,true);iv.setUint16(12,1,true);
 const timers=Array.from({length:24},()=>new Uint8Array(76)),voices=Array.from({length:6},()=>new Uint8Array(46));
 const tv=new DataView(timers[16].buffer);tv.setUint16(0x1e,0x100,true);tv.setUint16(0x20,0x3000,true);timers[16][0x16]=1;
 const command=new Uint8Array(10);command[4]=5;command[5]=127;new DataView(command.buffer).setUint32(6,20,true);
 const input={alternate:false,channelMasks:[1,2,4,8,16,32],owner:16,instrument,timers,voices,command,lastNotes:new Uint8Array(24)};
 const originalDriver=driver.slice(),originalTimers=timers.map(t=>t.slice()),originalVoices=voices.map(v=>v.slice());
 assert.throws(()=>startOriginalTandyAllocatedNote(input,driver,0x2000,0,undefined,'ms-1991'),/sample host/);
 const result=startOriginalTandyAllocatedNote(input,driver,0x2000,0,undefined,'ms-1991','deferred');
 assert.equal(result.voice,0);assert.equal(result.sampleStarts.length,1);
 assert.deepEqual(result.sampleStarts[0],{channel:0,offset:0x100,segment:0x3000,frequency:driver[0x32f+10]|driver[0x32f+11]<<8,repeats:type===6?0:1});
 assert.equal(result.voices[0][3],5);assert.deepEqual(driver,originalDriver);assert.deepEqual(timers,originalTimers);assert.deepEqual(voices,originalVoices);
 tv.setUint16(0,0x200,true);tv.setUint16(2,0x4000,true);
 const resource={headerOffset:0,headerSegment:0x4000,header:new Uint8Array(12),instrumentOffset:0x100,instrumentSegment:0x3000,instrument,sequenceOffset:0x200,sequenceSegment:0x4000,sequence:Uint8Array.from([0,5,20,1,0xd9])};
 const state={timers,voices,lastNotes:input.lastNotes,driver,driverGeneration:'ms-1991' as const};
 assert.throws(()=>stepOriginalTandyEffects(state,[resource],0,0x2000,0),/sample host/);
 const effect=stepOriginalTandyEffects(state,[resource],0,0x2000,0,undefined,'deferred');
 assert.deepEqual(effect.sampleStarts,result.sampleStarts);assert.equal(effect.voices[0][3],5);
 assert.equal(new DataView(effect.timers[16].buffer).getUint16(0,true),0x203);
 assert.deepEqual(driver,originalDriver);assert.deepEqual(voices,originalVoices);
 const program=runOriginalTandyEffects(state,[resource],0,0x2000,0,undefined,'deferred'),boundary=program.next();
 assert.equal(boundary.done,false);if(boundary.done)throw Error('Missing sample continuation');
 assert.deepEqual(boundary.value.sampleStarts,effect.sampleStarts);
 assert.equal(boundary.value.state.lastNotes[16],state.lastNotes[16],'Waiting sample callback retains prior last-note value');
 const resumedDriver=boundary.value.state.driver.slice();resumedDriver[0x587]=123;
 const finished=program.next({driver:resumedDriver,port61:17});assert.equal(finished.done,true);
 if(!finished.done)throw Error('Unexpected second continuation');
 assert.equal(finished.value.driver[0x587],123);assert.equal(finished.value.port61,17);
 assert.equal(finished.value.lastNotes[16],5,'Trailing last-note update occurs after continuation returns');
 assert.deepEqual(driver,originalDriver);
}
console.log('Allocated modern sample notes require explicit host ownership, return deferred requests with committed-copy state, and leave caller inputs unchanged');
