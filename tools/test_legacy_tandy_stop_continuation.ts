import assert from 'node:assert/strict';
import {runOriginalTandyChannelStop,stopOriginalTandyChannel} from '../lib/game/tandy-lifecycle.ts';
import {completeOriginalTandySample} from '../lib/game/tandy-sample.ts';
import {runOriginalTandyTrackStop,stopOriginalTandyTrack} from '../lib/game/tandy-track-control.ts';
import {runOriginalTandyAllocatedNote,startOriginalTandyAllocatedNote} from '../lib/game/tandy-note-start.ts';
import {runOriginalTandyCarRecords,stepOriginalTandyCarRecords} from '../lib/game/tandy-engine-interrupt.ts';
import {runOriginalTandyEngineStart,startOriginalTandyEngine} from '../lib/game/tandy-engine-start.ts';
for(const port61 of [0,1,2,3,255]){
 const driver=new Uint8Array(2993);driver[0x504]=1;driver[0x505]=2;
 const reference=driver.slice(),expected=stopOriginalTandyChannel(reference,0x2000,0,port61);
 const program=runOriginalTandyChannelStop(driver,0x2000,0,port61,undefined,true),boundary=program.next();
 assert.equal(boundary.done,false);assert.deepEqual(boundary.value.writes,[]);assert.equal(driver[0x504],0);
 assert.deepEqual(boundary.value.bios,[{ax:0x8300,es:0x2000,bx:0x50f,cx:1,dx:1}]);
 assert.deepEqual(completeOriginalTandySample(driver,0x91fb),{bios:[],chain:false});
 const final=program.next(driver);assert.equal(final.done,true);assert.deepEqual(final.value,expected);assert.deepEqual(driver,reference);
}
console.log('Legacy channel0 stop suspends before trailing PC gate write; completion observes cleared flag and synchronous output remains unchanged');
for(const cancel of [false,true]){
 const driver=new Uint8Array(2993),timers=Array.from({length:24},()=>new Uint8Array(72)),voices=Array.from({length:6},()=>new Uint8Array(46));
 driver[0x504]=1;timers[16][0x15]=6;
 for(const voice of voices){voice[0]=16;voice[1]=1;voice[2]=3;voice[16]=1;}
 const referenceDriver=driver.slice(),referenceTimers=timers.map(timer=>timer.slice()),referenceVoices=voices.map(voice=>voice.slice());
 const expected=stopOriginalTandyTrack(referenceDriver,referenceTimers,referenceVoices,16,0x2000,3);
 const program=runOriginalTandyTrackStop(driver,timers,voices,16,0x2000,3,16,undefined,true),boundary=program.next();
 assert.equal(boundary.done,false);assert.equal(voices[0][0],16);assert.equal(voices[0][1],1);assert.equal(timers[16][0x15],6);
 assert.deepEqual(boundary.value.writes,[]);assert.equal(driver[0x504],0);
 if(cancel){program.return(undefined as never);assert.equal(voices[0][0],16);assert.equal(timers[16][0x15],6);}
 else{const final=program.next({driver,port61:3});assert.equal(final.done,true);assert.deepEqual(final.value,expected);assert.deepEqual(driver,referenceDriver);assert.deepEqual(voices,referenceVoices);assert.deepEqual(timers,referenceTimers);}
}
console.log('Track stop suspends before voice ownership cleanup and later channels; successful completion retains synchronous output/state, cancellation does not run trailing cleanup');
for(const cancel of [false,true]){
 const driver=new Uint8Array(2993),timers=Array.from({length:24},(_,owner)=>{const timer=new Uint8Array(72);timer[0x16]=15;timer[0x23]=owner;timer[0x24]=3;timer[0x28]=127;return timer;}),voices=Array.from({length:6},()=>{const voice=new Uint8Array(46);voice[0]=255;return voice;});
 driver[0x504]=1;new DataView(driver.buffer).setUint16(0x41f+120,600,true);
 const old=voices[0],ov=new DataView(old.buffer);old[0]=17;old[1]=1;ov.setUint32(8,1,true);ov.setUint16(42,0x801e+17*72,true);timers[17][0x15]=1;
 new DataView(timers[16].buffer).setUint32(0x1e,0x90000100,true);
 const instrument=new Uint8Array(100),iv=new DataView(instrument.buffer);instrument[10]=1;iv.setUint16(12,1,true);iv.setUint16(6,0x100,true);iv.setUint16(8,0x3000,true);
 const command=new Uint8Array(10);command[4]=60;command[5]=100;new DataView(command.buffer).setUint32(6,100,true);
 const input={alternate:false,channelMasks:[1,2,4,8,16,32],owner:16,instrument,timers,voices,lastNotes:new Uint8Array(24),command};
 const sampleAt=()=>({offset:0x100,segment:0x3000,length:6}),expected=startOriginalTandyAllocatedNote(input,driver,0x2000,3,sampleAt);
 const program=runOriginalTandyAllocatedNote(input,driver,0x2000,3,sampleAt,undefined,'reject',true),boundary=program.next();
 assert.equal(boundary.done,false);
 if(boundary.done)assert.fail('Stealing sampled voice must suspend');
 assert.equal(boundary.value.state.voices[0][0],17);assert.equal(boundary.value.state.lastNotes[16],0);assert.equal(boundary.value.state.driver[0x504],0);
 assert.deepEqual(boundary.value.writes,[]);assert.equal(boundary.value.bios.length,1);
 if(cancel)program.return(undefined as never);
 else{const final=program.next({driver:boundary.value.state.driver,port61:3});assert.equal(final.done,true);assert.deepEqual(final.value,expected);}
 assert.equal(voices[0][0],17,'Caller source remains unchanged');assert.equal(driver[0x504],1);
 const car=new Uint8Array(76),cv=new DataView(car.buffer);car[0]=car[27]=1;cv.setUint16(2,16,true);cv.setUint16(0x1c,600,true);cv.setUint16(0x24,0x100,true);cv.setUint16(0x26,0x9000,true);instrument[14]=1;instrument[16]=1;
 const engineState={car,timers,voices,lastNotes:input.lastNotes,command,driver},expectedEngine=startOriginalTandyEngine(engineState,instrument,0x2000,3,sampleAt);
 const engineProgram=runOriginalTandyEngineStart(engineState,instrument,0x2000,3,true,sampleAt),engineBoundary=engineProgram.next();assert.equal(engineBoundary.done,false);
 if(engineBoundary.done)assert.fail('Engine restart must suspend occupied sample stop');
 assert.equal(engineBoundary.value.state.car[1],0);assert.equal(engineBoundary.value.state.car[26],0);assert.equal(engineBoundary.value.state.car[27],1);assert.equal(engineBoundary.value.state.lastNotes[16],0);
 if(cancel)engineProgram.return(undefined as never);
 else{const final=engineProgram.next({driver:engineBoundary.value.state.driver,port61:3});assert.equal(final.done,true);assert.deepEqual(final.value,expectedEngine);}
 assert.equal(car[1],0);assert.equal(car[26],0);
}
console.log('Voice stealing suspends before new note initialization/last-note publication and retains exact synchronous result after resume');
console.log('Engine restart suspends before running/initial-silence flags while stolen sample stop waits; resume matches synchronous output/state');
for(const cancel of [false,true]){
 const driver=new Uint8Array(2993),timers=Array.from({length:24},()=>new Uint8Array(72)),voices=Array.from({length:6},()=>{const voice=new Uint8Array(46);voice[0]=255;return voice;}),markers=new Uint8Array(24),cars=[new Uint8Array(76),new Uint8Array(76)];
 driver[0x504]=1;voices[0][0]=16;voices[0][1]=1;timers[16][0x15]=1;timers[16][0]=99;markers[16]=1;
 cars[0][0]=cars[0][1]=cars[0][27]=1;new DataView(cars[0].buffer).setUint16(20,16,true);
 cars[1][0]=1;new DataView(cars[1].buffer).setUint16(4,160,true);
 const before={driver,timers,voices,markers,cars,car:cars[0],carCounter:0,lastNotes:new Uint8Array(24),command:new Uint8Array(10)};
 const expected=stepOriginalTandyCarRecords(before,[],true,3,0x2000);
 const program=runOriginalTandyCarRecords(before,[],true,3,0x2000,127,true,true),boundary=program.next();assert.equal(boundary.done,false);
 if(boundary.done)assert.fail('Car cleanup must reach sample stop');
 assert.equal(boundary.value.state.cars[0][27],1);assert.equal(boundary.value.state.timers[16][0],99);assert.equal(boundary.value.state.markers[16],1);assert.equal(boundary.value.state.voices[0][0],16);
 assert.deepEqual(boundary.value.state.cars[1],cars[1],'Later car must not run before BIOS returns');
 if(cancel)program.return(undefined as never);
 else{const final=program.next({driver:boundary.value.state.driver,port61:3});assert.equal(final.done,true);assert.deepEqual(final.value,expected);}
 assert.equal(cars[0][27],1);assert.equal(timers[16][0],99);assert.equal(markers[16],1);
}
console.log('Car effect stop suspends before timer/marker cleanup and later car processing; resumed result is synchronous-identical, source remains untouched');
