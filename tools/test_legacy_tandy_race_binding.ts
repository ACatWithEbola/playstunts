import assert from 'node:assert/strict';
import {createLegacyTandyRaceBinding} from '../lib/game/legacy-tandy-race-binding.ts';
function fixture(closeOnCompletion=false,deferCompletionInterrupts=false){
 const memory=Uint8Array.from([0,255]),events:string[]=[],reads:number[]=[];let resumed=false,released=false;
 function* program(){try{events.push('enter');yield {writes:[],bios:[{ax:0x8307,es:0,bx:0,cx:2,dx:4}],sampleStarts:[]};resumed=true;events.push('resume');return {writes:[],bios:[]};}finally{released=true;}}
 const profile:Parameters<typeof createLegacyTandyRaceBinding>[1]={deferCompletionInterrupts,sampleRate:48000,tone:{variant:'pssj3',clockHz:3579545,psgGain:0,speakerGain:0},sampleGain:1,initialByte:128,initialVolume:0,decodeByte:value=>(value-128)/128,
  program,nestedInterrupt(frame){assert.equal(resumed,false);events.push(`nested:${frame}`);},bios(request,frame,bus){assert.equal(bus.play(request).carry,false);events.push(`bios:${frame}`);return false;},
  completion(ax,frame){assert.equal(ax,0x91fb);events.push(`completion:${frame}`);if(closeOnCompletion)binding.close();},
 };
 const binding=createLegacyTandyRaceBinding(address=>{reads.push(address);return memory[address];},profile);
 profile.program=function*(){throw Error('Mutated profile must not replace active program');};profile.bios=()=>{throw Error('Mutated profile must not replace BIOS owner');};profile.sampleGain=999;profile.tone.psgGain=999;
 binding.scheduleGameInterrupt(0);binding.scheduleDma(1);binding.scheduleGameInterrupt(2);binding.scheduleDma(3);
 if(deferCompletionInterrupts)binding.scheduleCompletionInterrupt(5);
 binding.scheduleBiosReturn(deferCompletionInterrupts?6:4);
 return {binding,events,reads,flags:()=>({resumed,released})};
}
const whole=fixture(),split=fixture(),pcm=whole.binding.render(6),parts=[...split.binding.render(1),...split.binding.render(2),...split.binding.render(3)];
assert.deepEqual(Array.from(pcm),[0,-1,-1,127/128,127/128,127/128]);assert.deepEqual(parts,Array.from(pcm));assert.deepEqual(whole.events,split.events);assert.deepEqual(whole.reads,[0,1]);
assert.deepEqual(whole.events,['enter','bios:0','nested:2','completion:3','resume']);assert.deepEqual(whole.flags(),{resumed:true,released:true});assert.equal(whole.binding.waiting,false);
whole.binding.close();split.binding.close();
const cancelled=fixture();cancelled.binding.render(1);assert.equal(cancelled.binding.waiting,true);cancelled.binding.close();assert.deepEqual(cancelled.flags(),{resumed:false,released:true});assert.throws(()=>cancelled.binding.render(1),/unavailable/);
const completionClosed=fixture(true);assert.throws(()=>completionClosed.binding.render(6),/unavailable/);
assert.deepEqual(completionClosed.flags(),{resumed:false,released:true},'Completion cancellation releases waiting CPU program without resuming');
assert.deepEqual(completionClosed.events,['enter','bios:0','nested:2','completion:3']);assert.deepEqual(completionClosed.reads,[0,1]);assert.equal(completionClosed.binding.waiting,false);
assert.throws(()=>completionClosed.binding.render(1),/unavailable/);
const delayed=fixture(false,true),delayedWhole=fixture(false,true);
const firstPart=delayed.binding.render(4);assert.equal(delayed.binding.pendingCompletionInterrupts,1);assert.equal(delayed.binding.waiting,true);
assert.deepEqual(delayed.events,['enter','bios:0','nested:2']);assert.deepEqual(delayed.flags(),{resumed:false,released:false});
const lastPart=delayed.binding.render(4);assert.deepEqual([...firstPart,...lastPart],Array.from(delayedWhole.binding.render(8)));
assert.deepEqual(delayed.events,['enter','bios:0','nested:2','completion:5','resume']);assert.deepEqual(delayed.events,delayedWhole.events);
assert.equal(delayed.binding.pendingCompletionInterrupts,0);assert.deepEqual(delayed.flags(),{resumed:true,released:true});delayed.binding.close();delayedWhole.binding.close();
const pendingCancelled=fixture(false,true);pendingCancelled.binding.render(4);pendingCancelled.binding.close();assert.equal(pendingCancelled.binding.pendingCompletionInterrupts,0);assert.deepEqual(pendingCancelled.flags(),{resumed:false,released:true});
console.log('Explicit legacy race binding preserves split PCM and BIOS/DMA/completion/nested/return order, holds CPU until supplied return and releases on close; no timing profile invented');
function biosWindow(closeOnCompletion=false){
 const events:string[]=[],reads:number[]=[];let calls=0,released=false;
 const binding=createLegacyTandyRaceBinding(address=>{reads.push(address);return address?255:0;},{sampleRate:48000,tone:{variant:'pssj3',clockHz:3579545,psgGain:0,speakerGain:0},sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,deferCompletionInterrupts:true,
  program:function*(){try{yield {writes:[],bios:[{ax:0x8307,es:0,bx:0,cx:1,dx:1}],sampleStarts:[]};yield {writes:[],bios:[{ax:0x8307,es:0,bx:1,cx:1,dx:1}],sampleStarts:[]};events.push('resumed');return {writes:[],bios:[]};}finally{released=true;}},nestedInterrupt(){assert.fail('No nested game IRQ supplied');},
  bios(request,frame,bus){calls++;events.push(`bios-enter:${calls}`);if(calls===2){assert.equal(frame,2);bus.deliverCompletionInterrupt();assert.equal(bus.status().carry,false);events.push('status-idle');}assert.equal(bus.play(request).carry,false);events.push(`bios-return:${calls}`);return calls===2;},
  completion(ax,frame,bus){assert.equal(ax,0x91fb);events.push(`completion:${frame}`);assert.throws(()=>bus.deliverCompletionInterrupt(),/already active/);if(closeOnCompletion)binding.close();},
 });
 binding.scheduleGameInterrupt(0);binding.scheduleDma(1);binding.scheduleBiosReturn(2);binding.scheduleDma(3);binding.scheduleCompletionInterrupt(4);
 return {binding,events,reads,released:()=>released};
}
const inCall=biosWindow(),inCallSplit=biosWindow();assert.deepEqual(Array.from(inCall.binding.render(6)),[...inCallSplit.binding.render(1),...inCallSplit.binding.render(1),...inCallSplit.binding.render(4)]);
assert.deepEqual(inCall.events,['bios-enter:1','bios-return:1','bios-enter:2','completion:2','status-idle','bios-return:2','resumed','completion:4']);assert.deepEqual(inCall.events,inCallSplit.events);assert.deepEqual(inCall.reads,[0,1]);assert.ok(inCall.released());inCall.binding.close();inCallSplit.binding.close();
const closedWindow=biosWindow(true);assert.throws(()=>closedWindow.binding.render(6),/unavailable/);assert.deepEqual(closedWindow.events,['bios-enter:1','bios-return:1','bios-enter:2','completion:2']);assert.deepEqual(closedWindow.reads,[0]);assert.ok(closedWindow.released());
console.log('Pending completion executes inside explicitly supplied BIOS window before status/play/CPU return, with split PCM parity and cancellation stopping further BIOS work');
