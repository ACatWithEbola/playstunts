import assert from 'node:assert/strict';
import {createLegacyTandyMixedAudio} from '../lib/game/legacy-tandy-mixed-audio.ts';
import {createOriginalTandyToneAudio} from '../lib/game/tandy-tone-audio.ts';
const tone={variant:'pssj3' as const,clockHz:3579545,psgGain:0,speakerGain:0};
function fixture(){
 const memory=Uint8Array.from([0,128,255,0,64,255]);
 const completions:number[][]=[],biosResults:number[][]=[],writes:number[][]=[],game:number[]=[];
 const profile={sampleRate:48000,tone:{...tone},sampleGain:1,initialByte:128,initialVolume:0,decodeByte:(byte:number)=>(byte-128)/128,
  completion(ax:number,frame:number,bus:Parameters<Parameters<typeof createLegacyTandyMixedAudio>[1]['completion']>[2]){completions.push([ax,frame]);if(frame===6)bus.play({ax:0x8307,es:0,bx:4,cx:2,dx:4});},
  gameInterrupt(frame:number,bus:Parameters<Parameters<typeof createLegacyTandyMixedAudio>[1]['gameInterrupt']>[1]){game.push(frame);if(frame===5){memory[2]=192;bus.write([[0xc7,0xe0]]);}else bus.write([[0xc0,0x90]]);},
  biosResult(result:{ax:number;carry:boolean},frame:number){biosResults.push([frame,result.ax,Number(result.carry)]);},busWrite(port:number,value:number,frame:number){writes.push([frame,port,value]);},
 };
 const mixed=createLegacyTandyMixedAudio(address=>memory[address],profile);
 profile.sampleGain=999;profile.tone.psgGain=999;
 const request={ax:0x8307,es:0,bx:0,cx:3,dx:4};mixed.scheduleBios(0,request);request.bx=4;
 mixed.scheduleBios(1,{ax:0x8300,es:0,bx:4,cx:1,dx:1});
 mixed.scheduleDma(2);const pending=[[0xc7,0]];mixed.scheduleWrites(3,pending);pending[0][1]=0xe0;
 mixed.scheduleGameInterrupt(3);mixed.scheduleDma(4);mixed.scheduleGameInterrupt(5);mixed.scheduleDma(6);mixed.scheduleDma(8);mixed.scheduleDma(9);
 return {mixed,memory,completions,biosResults,writes,game};
}
const whole=fixture(),split=fixture();
const expected=whole.mixed.render(12),parts=[...split.mixed.render(0),...split.mixed.render(1),...split.mixed.render(2),...split.mixed.render(3),...split.mixed.render(1),...split.mixed.render(5)];
assert.deepEqual(Array.from(expected),[0,0,-1,0,0,0,.5,.5,-.5,127/128,127/128,127/128]);assert.deepEqual(parts,Array.from(expected));
for(const key of ['memory','completions','biosResults','writes','game'] as const)assert.deepEqual(whole[key],split[key]);
assert.deepEqual(whole.completions,[[0x91fb,6],[0x91fb,9]]);assert.deepEqual(whole.biosResults,[[0,7,0],[1,0,1],[6,7,0]]);assert.equal(whole.mixed.status().carry,false);
assert.throws(()=>whole.mixed.scheduleDma(11),/position/);assert.throws(()=>whole.mixed.scheduleWrites(12,[[0xc0,256]]),/bus write/);assert.throws(()=>whole.mixed.scheduleBios(12,{ax:0x8307,es:0,bx:0,cx:0,dx:4}),/request/);
whole.mixed.close();assert.throws(()=>whole.mixed.render(1),/unavailable/);assert.throws(()=>whole.mixed.write([[0xc0,0]]),/unavailable/);

for(const rate of [44100,48000]){
 let callbacks=0;
 const activeTone={...tone,psgGain:.5,speakerGain:1};
 const reference=createOriginalTandyToneAudio(rate,activeTone);reference.write(0x43,0xb6);
 const mixed=createLegacyTandyMixedAudio(()=>128,{sampleRate:rate,tone:activeTone,sampleGain:.5,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,completion(){assert.fail('No DMA event supplied');},gameInterrupt(frame,bus){callbacks++;bus.write(frame===0?[[0xc0,0x81],[0xc0,0x10],[0xc0,0x90]]:[[0xc0,0x9f]]);}});
 mixed.scheduleGameInterrupt(0);mixed.scheduleGameInterrupt(511);
 for(const [port,value] of [[0xc0,0x81],[0xc0,0x10],[0xc0,0x90]])reference.write(port,value);
 const first=reference.render(511);reference.write(0xc0,0x9f);const second=reference.render(489);
 assert.deepEqual(Array.from(mixed.render(1000)),[...first,...second]);assert.equal(callbacks,2,'Mixer must not run an independent timer');mixed.close();
}
const broken=createLegacyTandyMixedAudio(()=>{throw Error('DMA read failed');},{sampleRate:48000,tone,sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,completion(){},gameInterrupt(){}});
broken.scheduleBios(0,{ax:0x8307,es:0,bx:0,cx:1,dx:1});broken.scheduleDma(1);assert.throws(()=>broken.render(2),/DMA read failed/);assert.throws(()=>broken.render(2),/unavailable/);
assert.throws(()=>broken.status(),/unavailable/);
for(const startFirst of [false,true]){
 let completions=0;
 const ordered=createLegacyTandyMixedAudio(()=>255,{sampleRate:48000,tone,sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,completion(){completions++;},gameInterrupt(){}});
 if(!startFirst)ordered.scheduleDma(0);
 ordered.scheduleBios(0,{ax:0x8307,es:0,bx:0,cx:1,dx:1});
 if(startFirst)ordered.scheduleDma(0);
 assert.equal(ordered.render(1)[0],startFirst?127/128:0);assert.equal(completions,Number(startFirst));assert.equal(ordered.status().carry,!startFirst);ordered.close();
}
// Terminal count queues a notification; only the supplied interrupt boundary
// invokes the driver and starts its repeat transfer. Coincident events retain
// caller order rather than imposing an invented interrupt priority.
function delayedRepeat(completionFirst:boolean){
 const order:string[]=[],completions:number[]=[];
 const mixed=createLegacyTandyMixedAudio(address=>address===0?0:255,{sampleRate:48000,tone,sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,deferCompletionInterrupts:true,
  completion(ax,frame,bus){assert.equal(ax,0x91fb);completions.push(frame);order.push(`completion:${frame}`);if(frame===4)assert.equal(bus.play({ax:0x8307,es:0,bx:1,cx:1,dx:1}).carry,false);},
  gameInterrupt(frame){order.push(`game:${frame}`);},
 });
 mixed.scheduleBios(0,{ax:0x8307,es:0,bx:0,cx:1,dx:1});mixed.scheduleDma(1);
 if(completionFirst)mixed.scheduleCompletionInterrupt(4);
 mixed.scheduleGameInterrupt(4);
 if(!completionFirst)mixed.scheduleCompletionInterrupt(4);
 mixed.scheduleDma(5);mixed.scheduleCompletionInterrupt(7);
 return {mixed,order,completions};
}
for(const completionFirst of [false,true]){
 const whole=delayedRepeat(completionFirst),split=delayedRepeat(completionFirst);
 const first=split.mixed.render(3);assert.equal(split.mixed.pendingCompletionInterrupts,1);assert.deepEqual(split.completions,[]);
 const rest=split.mixed.render(5);assert.deepEqual([...first,...rest],Array.from(whole.mixed.render(8)));
 assert.deepEqual([...first,...rest],[0,-1,-1,-1,-1,127/128,127/128,127/128]);
 assert.deepEqual(split.order,completionFirst?['completion:4','game:4','completion:7']:['game:4','completion:4','completion:7']);
 assert.deepEqual(split.order,whole.order);assert.deepEqual(split.completions,[4,7]);assert.equal(split.mixed.pendingCompletionInterrupts,0);
 whole.mixed.close();split.mixed.close();
}
function boundaryTransfer(start:number){
 const memory=new Uint8Array(0x100000),reads:number[]=[],completions:number[]=[];
 for(let i=0;i<4;i++)memory[(start+i)&0xfffff]=[0,64,192,255][i];
 const mixed=createLegacyTandyMixedAudio(address=>{reads.push(address);return memory[address];},{sampleRate:48000,tone,sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,deferCompletionInterrupts:true,completion(ax,frame){assert.equal(ax,0x91fb);completions.push(frame);},gameInterrupt(){}});
 mixed.scheduleBios(0,{ax:0x8307,es:start>>>4,bx:start&15,cx:4,dx:123});
 mixed.scheduleDma(1);mixed.scheduleDma(2);
 // The host supplies this reprogramming gap, not a fabricated firmware delay.
 mixed.scheduleDma(8);mixed.scheduleDma(9);mixed.scheduleCompletionInterrupt(11);
 return {mixed,reads,completions};
}
for(const start of [0xfffe,0x3fffe,0xffffe]){
 const whole=boundaryTransfer(start),split=boundaryTransfer(start);
 const first=split.mixed.render(7);assert.equal(split.mixed.status().carry,true);assert.equal(split.mixed.pendingCompletionInterrupts,0);
 assert.deepEqual(split.reads,[start,(start+1)&0xfffff]);assert.deepEqual(split.completions,[]);
 const finalBytes=split.mixed.render(3);assert.equal(split.mixed.status().carry,false);assert.equal(split.mixed.pendingCompletionInterrupts,1);assert.deepEqual(split.completions,[]);
 const final=split.mixed.render(2);assert.deepEqual([...first,...finalBytes,...final],Array.from(whole.mixed.render(12)));
 assert.deepEqual([...first,...finalBytes,...final],[0,-1,-.5,-.5,-.5,-.5,-.5,-.5,.5,127/128,127/128,127/128]);
 assert.deepEqual(split.reads,Array.from({length:4},(_,i)=>(start+i)&0xfffff));assert.deepEqual(split.completions,[11]);
 assert.deepEqual(split.reads,whole.reads);assert.deepEqual(split.completions,whole.completions);split.mixed.close();whole.mixed.close();
}
function segmentedMixer(){
 const memory=new Uint8Array(0x100000);memory.set([0,64],0x3fffe);memory.set([192,255],0x40000);const reads:number[]=[],events:string[]=[];
 const mixed=createLegacyTandyMixedAudio(address=>{reads.push(address);return memory[address];},{sampleRate:48000,tone,sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,deferCompletionInterrupts:true,pauseAt64KiB:true,
  segmentBoundary(frame,bus){assert.equal(bus.status().carry,true);events.push(`segment:${frame}`);},completion(ax,frame){assert.equal(ax,0x91fb);events.push(`completion:${frame}`);},
  gameInterrupt(frame,bus){if(frame===4){assert.equal(bus.status().carry,true);bus.resumeDmaSegment();assert.equal(bus.status().carry,true);events.push('restarted-busy');}else{bus.deliverCompletionInterrupt();assert.equal(bus.status().carry,false);events.push('idle');}},
 });
 mixed.scheduleBios(0,{ax:0x8307,es:0x3fff,bx:14,cx:4,dx:4095});for(const frame of [1,2,3])mixed.scheduleDma(frame);mixed.scheduleGameInterrupt(4);for(const frame of [5,6,7])mixed.scheduleDma(frame);mixed.scheduleGameInterrupt(8);
 return {mixed,reads,events};
}
const segmented=segmentedMixer(),segmentedSplit=segmentedMixer();assert.deepEqual(Array.from(segmented.mixed.render(10)),[...segmentedSplit.mixed.render(3),...segmentedSplit.mixed.render(2),...segmentedSplit.mixed.render(5)]);
assert.deepEqual(segmented.reads,[0x3fffe,0x3ffff,0x40000,0x40001]);assert.deepEqual(segmented.events,['segment:2','restarted-busy','completion:8','idle']);assert.deepEqual(segmentedSplit.events,segmented.events);segmented.mixed.close();segmentedSplit.mixed.close();
const queuedFrames:number[]=[];
const queued=createLegacyTandyMixedAudio(()=>255,{sampleRate:48000,tone,sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,deferCompletionInterrupts:true,completion(ax,frame){assert.equal(ax,0x91fb);queuedFrames.push(frame);},gameInterrupt(){}});
queued.scheduleBios(0,{ax:0x8307,es:0,bx:0,cx:1,dx:1});queued.scheduleDma(1);
queued.scheduleBios(2,{ax:0x8307,es:0,bx:1,cx:1,dx:1});queued.scheduleDma(3);
queued.scheduleCompletionInterrupt(5);queued.scheduleCompletionInterrupt(6);
queued.render(4);assert.equal(queued.pendingCompletionInterrupts,2,'Completed transfers retain separate notifications');assert.equal(queued.status().carry,false);
queued.render(1);assert.equal(queued.pendingCompletionInterrupts,1);assert.deepEqual(queuedFrames,[5]);
queued.render(1);assert.equal(queued.pendingCompletionInterrupts,0);assert.deepEqual(queuedFrames,[5,6]);
queued.scheduleCompletionInterrupt(7);assert.throws(()=>queued.render(1),/No pending legacy completion interrupt/);assert.deepEqual(queuedFrames,[5,6]);assert.throws(()=>queued.render(0),/unavailable/);queued.close();
for(const closeAt of ['write','bios'] as const){
 let writes=0,bios=0,reads=0;
 const mixer=createLegacyTandyMixedAudio(()=>{reads++;return 192;},{sampleRate:48000,tone,sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,completion(){assert.fail('Closed mixer must not complete');},gameInterrupt(){assert.fail('Closed mixer must not run another game IRQ');},
  busWrite(){writes++;if(closeAt==='write')mixer.close();},biosResult(){bios++;if(closeAt==='bios')mixer.close();}});
 if(closeAt==='write')mixer.scheduleWrites(0,[[0xc0,0x90],[0xc0,0x9f]]);
 else mixer.scheduleBios(0,{ax:0x8307,es:0,bx:0,cx:1,dx:1});
 mixer.scheduleDma(1);mixer.scheduleGameInterrupt(2);assert.throws(()=>mixer.render(3),/unavailable/);
 assert.equal(writes,closeAt==='write'?1:0);assert.equal(bios,closeAt==='bios'?1:0);assert.equal(reads,0);
 assert.throws(()=>mixer.render(0),/unavailable/);mixer.close();
}
let callbackMixer:ReturnType<typeof createLegacyTandyMixedAudio>,laterCallbacks=0;
callbackMixer=createLegacyTandyMixedAudio(()=>128,{sampleRate:48000,tone,sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,completion(){},gameInterrupt(frame){if(frame===0){assert.throws(()=>callbackMixer.render(0),/Invalid legacy/);callbackMixer.close();}else laterCallbacks++;}});
callbackMixer.scheduleGameInterrupt(0);callbackMixer.scheduleGameInterrupt(1);assert.throws(()=>callbackMixer.render(2),/unavailable/);assert.equal(laterCallbacks,0);assert.throws(()=>callbackMixer.status(),/unavailable/);
console.log('Legacy Tandy mixed sample/tone output retains exact split-buffer PCM, live DMA bytes, busy BIOS, completion/repeat, volume latch and caller event order; no autonomous IRQ or BIOS latency invented');
