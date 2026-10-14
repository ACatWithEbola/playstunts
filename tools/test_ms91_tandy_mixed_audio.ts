import assert from 'node:assert/strict';
import {createMs91TandyMixedAudio} from '../lib/game/ms91-tandy-mixed-audio.ts';
import {startOriginalTandyAllocatedNote} from '../lib/game/tandy-note-start.ts';
import {stepOriginalTandyEffects} from '../lib/game/tandy-effect-runtime.ts';
import {createOriginalTandyToneStream} from '../lib/game/tandy-tone-audio.ts';
import {versionedTd15Resource} from '../lib/game/versioned-td15-resource.ts';
function run(blocks:number[],differential:boolean,irqStart=false,effectStart=false,mutateProfile=true){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),base=0x20000,header=0x30100;
 v.setUint16(base+0x58c,0x2e9c,true);v.setUint16(0x20,0x1234,true);v.setUint16(0x22,0x5678,true);
 memory[header+4]=differential?6:0;v.setUint16(header+8,6,true);memory.set([128,55,134,217,44,128],header+50);
 v.setUint16(base+0x32f+10,8000,true);
 const instrument=new Uint8Array(96),iv=new DataView(instrument.buffer);
 instrument[10]=1;instrument[5]=differential?6:0;iv.setUint16(6,0x100,true);iv.setUint16(8,0x3000,true);iv.setUint16(12,1,true);
 let timers=Array.from({length:24},()=>new Uint8Array(76)),voices=Array.from({length:6},()=>new Uint8Array(46)),lastNotes=new Uint8Array(24);
 const tv=new DataView(timers[16].buffer);tv.setUint16(0x1e,0x100,true);tv.setUint16(0x20,0x3000,true);timers[16][0x16]=1;
 if(effectStart){tv.setUint16(0,0x200,true);tv.setUint16(2,0x4000,true);}
 const resource={headerOffset:0,headerSegment:0x4000,header:new Uint8Array(12),instrumentOffset:0x100,instrumentSegment:0x3000,instrument,sequenceOffset:0x200,sequenceSegment:0x4000,sequence:Uint8Array.from([0,5,20,1,0xd9])};
 const command=new Uint8Array(10);command[4]=5;command[5]=127;new DataView(command.buffer).setUint32(6,20,true);
 let elapsed=0,started=false;const game:number[]=[],writes:number[][]=[];
 const request={channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1};
 const profile:Parameters<typeof createMs91TandyMixedAudio>[2]={sampleRate:48000,picMask:0x80,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,
  gameInterrupt(offset){game.push(elapsed+offset);let noteWrites:number[][]=[];
   if(irqStart&&!started){
    const before=memory.slice();assert.throws(()=>mixed.startAt(request,offset+1),/current game IRQ/);assert.deepEqual(memory,before);
    const driver=memory.slice(base,base+3241);
    const allocated=effectStart?stepOriginalTandyEffects({timers,voices,lastNotes,driver,driverGeneration:'ms-1991'},[resource],mixed.port61,0x2000,0,undefined,'deferred'):
     startOriginalTandyAllocatedNote({alternate:false,channelMasks:[1,2,4,8,16,32],owner:16,instrument,timers,voices,lastNotes,command},driver,0x2000,mixed.port61,undefined,'ms-1991','deferred');
    assert.equal(allocated.sampleStarts.length,1);
    noteWrites=allocated.writes;
    memory.set(allocated.driver,base);({timers,voices,lastNotes}=allocated);
    assert.equal(mixed.startAt(allocated.sampleStarts[0],offset),true);
    started=true;
   }else if(irqStart&&differential&&mixed.status(0)===0){
    // Let the looping differential note play until the next owning game IRQ,
    // then stop through the original request rather than altering its repeat.
    mixed.requestStop();
   }
   return [...noteWrites,[0xc7,0xe0]];
  },busWrite:(port,value,offset)=>writes.push([port,value,elapsed+offset])};
 const mixed=createMs91TandyMixedAudio(()=>memory,0x2000,profile);
 if(mutateProfile){profile.sampleGain=999;profile.tone.psgGain=999;profile.initialDac.data=0;
 profile.gameInterrupt=()=>{throw Error('Caller mutation replaced owning game IRQ');};
 profile.busWrite=()=>{throw Error('Caller mutation replaced owning bus');};}
 mixed.write([[0xc0,0x85],[0xc1,0x10],[0xc0,0x90]]);
 assert.throws(()=>mixed.startAt(request,0),/current game IRQ/);
 if(!irqStart)mixed.start(request);
 const pcm=new Float32Array(blocks.reduce((a,b)=>a+b,0));
 for(const count of blocks){pcm.set(mixed.render(count),elapsed);elapsed+=count;}
 assert.ok(pcm.every(Number.isFinite));assert.ok(pcm.some(value=>value!==0));assert.ok(game.length>0);
 assert.equal(mixed.status(0),1);assert.equal(memory[base+0x595],0);
 if(irqStart){assert.equal(started,true);assert.ok(game[0]>0);
  const directStart=writes.find(([port,value])=>port===0xc4&&value===3);
  assert.equal(directStart?.[2],game[0],'Direct DAC startup occurs at the owning game interrupt, not buffer zero');
  assert.ok(writes.some(([port,,frame])=>port===0xc5&&frame>game[0]),'Allocated sample reaches actual DAC delivery before stopping');
 }
 assert.ok(writes.every((entry,index)=>index===0||entry[2]>=writes[index-1][2]),'Bus writes never move backwards');
 mixed.close();assert.throws(()=>mixed.render(1),/unavailable/);
 const closedMemory=memory.slice();assert.throws(()=>mixed.requestStop(),/unavailable/);assert.deepEqual(memory,closedMemory);
 return {pcm,game,writes,memory,timers,voices,lastNotes};
}
for(const differential of [false,true])for(const [irqStart,effectStart] of [[false,false],[true,false],[true,true]]){const reference=run([5120],differential,irqStart,effectStart,false);assert.deepEqual(run([5120],differential,irqStart,effectStart),reference);assert.deepEqual(run([1,17,100,333,4669],differential,irqStart,effectStart),reference);}
console.log('Modern mixed PSG/direct-DAC output is split-block exact with one shared sample/game IRQ chain, stop restoration and timed DAC control writes; virtual CPU/explicit mix, not game-wired');
{
 const memory=new Uint8Array(0x100000),view=new DataView(memory.buffer);view.setUint16(0x20000+0x58c,0x2e9c,true);
 let writes=0;
 const mixed=createMs91TandyMixedAudio(()=>memory,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,gameInterrupt:()=>[],
  busWrite(){writes++;throw Error('Injected owning bus failure');}});
 assert.throws(()=>mixed.write([[0xc0,0x90]]),/owning bus failure/);
 const afterFailure=memory.slice(),beforeWrites=writes;
 assert.throws(()=>mixed.requestStop(),/unavailable/);assert.deepEqual(memory,afterFailure);
 assert.throws(()=>mixed.render(512),/unavailable/);assert.throws(()=>mixed.write([[0xc7,0]]),/unavailable/);
 assert.equal(writes,beforeWrites);mixed.close();mixed.close();
}
console.log('Failed/closed modern mixer rejects stop, rendering and further bus writes without mutating sample-driver memory');
for(const sampleRate of [44100,48000]){
 const memory=new Uint8Array(0x100000);memory.set(versionedTd15Resource('ms-1991')!,0x20000);
 const tone={variant:'pssj3' as const,clockHz:3579545,psgGain:0.5,speakerGain:1};
 let mixedTicks=0,toneTicks=0;
 const writes=(tick:number)=>[[0xc0,0x85],[0xc1,0x10],[0xc0,tick%2?0x90:0x9f]];
 const mixed=createMs91TandyMixedAudio(()=>memory,0x2000,{sampleRate,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,tone,sampleGain:0.5,
  gameInterrupt(){return writes(++mixedTicks);},busWrite(){}});
 const baseline=createOriginalTandyToneStream({tick(){return {writes:writes(++toneTicks),bios:[]};}},[],sampleRate,tone);
 for(const frames of [1,17,100,333,sampleRate-451])assert.deepEqual(mixed.render(frames),baseline.render(frames),'Idle sample host preserves original tone PCM and game IRQ cadence');
 assert.equal(mixedTicks,toneTicks);assert.equal(mixedTicks,99);mixed.close();
}
console.log('Unmodified modern driver PIT divisor preserves original tone-only PCM and IRQ cadence at44100/48000Hz with no active sample');
