import assert from 'node:assert/strict';
import {createMs91TandyRaceBinding} from '../lib/game/ms91-tandy-race-binding.ts';
import {versionedTd15Resource} from '../lib/game/versioned-td15-resource.ts';
import {advanceOriginalHardwareClock} from '../lib/game/hardware-clock-memory.ts';
const fixture=()=>{const m=new Uint8Array(0x100000);m.set(versionedTd15Resource('ms-1991')!,0x20000);new DataView(m.buffer).setUint16(0x30108,100,true);m.fill(192,0x30132,0x30132+100);return m;};
const first=fixture(),second=fixture();let ticks=0,started=false;
const binding=createMs91TandyRaceBinding(0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
 initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
 tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(){}});
const request={channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:0};
assert.throws(()=>binding.render(1),/not attached/);
binding.attach(()=>first,()=>{ticks++;if(!started){binding.sampleStarts([request],first);started=true;}return [];});
assert.throws(()=>binding.sampleStarts([request],first),/owning game IRQ/);
binding.render(512);assert.equal(started,true);assert.throws(()=>binding.attach(()=>second,()=>[]),/completed sample stop/);
let releaseWait!:()=>void;
const replacement=binding.replaceSample({...request,repeats:1},()=>new Promise<void>(resolve=>{releaseWait=resolve;}));
assert.throws(()=>binding.attach(()=>second,()=>[]),/pending replacement/);
await assert.rejects(binding.replaceSample(request,async()=>{}),/already pending/);
binding.render(8);releaseWait();assert.equal(await replacement,true);binding.render(1024);assert.equal(binding.status(0),1);
binding.requestStop();binding.render(512);binding.attach(()=>second,()=>{ticks++;return [];});
binding.write([[0xc0,0x85],[0xc1,0x10],[0xc0,0x90]]);assert.ok(binding.render(512).some(value=>value!==0));
assert.ok(ticks>0);binding.close();binding.close();assert.throws(()=>binding.render(1),/not attached/);assert.throws(()=>binding.attach(()=>first,()=>[]),/closed/);
console.log('Modern Tandy race binding delivers only within owning IRQ and memory, rejects active-transfer reload, reattaches after stop and closes idempotently');
{
 const profile={sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:(value:number)=>(value-128)/128,
  tone:{variant:'pssj3' as const,clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(){}};
 const owned=createMs91TandyRaceBinding(0x2000,profile),reference=createMs91TandyRaceBinding(0x2000,profile);
 profile.sampleRate=44100;profile.initialDac.amplitudeFrequency=0;profile.tone.clockHz=123456;profile.tone.psgGain=0;
 assert.equal(owned.sampleRate,48000);
 for(const audio of [owned,reference]){const memory=fixture();audio.attach(()=>memory,()=>[]);audio.write([[0xc0,0x85],[0xc1,0x10],[0xc0,0x90]]);}
 assert.deepEqual(owned.render(512),reference.render(512),'Later caller profile changes must not alter attached audio');
 owned.close();reference.close();
}
console.log('Race binding owns reset/mix/rate profile snapshots across later caller mutations');
{
 const memory=fixture();let started=false;
 const binding=createMs91TandyRaceBinding(0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(){}});
 binding.attach(()=>memory,()=>{if(!started){binding.sampleStarts([request],memory);started=true;}return [];});binding.render(512);
 let waitCancelled=false;
 const pending=binding.replaceSample(request,signal=>new Promise<void>(resolve=>{assert.ok(signal);signal.addEventListener('abort',()=>{waitCancelled=true;resolve();},{once:true});}));
 binding.close();assert.equal(await pending,false);assert.equal(waitCancelled,true,'Binding close propagates cancellation to IRQ wait owner');assert.throws(()=>binding.render(1),/not attached/);
}
console.log('Closing race binding cancels unresolved replacement waits without starting another transfer');
function continuationRun(blocks:number[],cancel=false,nested=false){
 const memory=fixture(),view=new DataView(memory.buffer);view.setUint16(0x30208,100,true);memory.fill(192,0x30232,0x30232+100);
 let begun=false,released=false,completed=false,elapsed=0,nestedCalls=0;const writes:number[][]=[];
 const d=0x2d1a0;view.setUint32(d+0x407a,20,true);view.setUint16(d+0x4088,5,true);view.setUint16(d+0x4086,5,true);
 const bound=createMs91TandyRaceBinding(0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(port,value,position){writes.push([port,value,elapsed+position]);}});
 function* program(){
  if(begun)return {writes:[],bios:[]};
  begun=true;try{
   if(nested){
    yield {writes:[],bios:[],sampleStarts:[request]};
    view.setUint16(0x20000+0x590,1,true);
    yield {writes:[],bios:[],sampleStarts:[{...request,offset:0x200,repeats:1}]};
    assert.equal(nestedCalls,1,'Chained hardware interrupt precedes continuation return');
   }else yield {writes:[],bios:[],sampleStarts:[request,{...request,offset:0x200,repeats:1}]};
   completed=true;return {writes:[],bios:[]};
  }finally{released=true;}
 }
 bound.attach(()=>memory,()=>{assert.fail('Continuation binding cannot also run synchronous tick');},program,()=>{
  nestedCalls++;assert.equal(completed,false);assert.equal(released,false);advanceOriginalHardwareClock(memory,d);
 });
 if(cancel){
  for(let i=0;i<1000&&!begun;i++){bound.render(1);elapsed++;}
  assert.equal(begun,true);assert.equal(completed,false);assert.equal(released,false);
  const before=memory.slice();assert.throws(()=>bound.attach(()=>fixture(),()=>[]),/pending CPU continuation/);assert.deepEqual(memory,before);
  bound.close();assert.equal(released,true);assert.equal(completed,false);return;
 }
 const pcm=new Float32Array(blocks.reduce((a,b)=>a+b,0));
 for(const frames of blocks){pcm.set(bound.render(frames),elapsed);elapsed+=frames;}
 assert.equal(completed,true);assert.equal(released,true);assert.ok(pcm.every(Number.isFinite));
 assert.equal(writes.filter(([port,value])=>port===0xc4&&value===3).length,2);
 if(nested){assert.equal(nestedCalls,1);assert.equal(view.getUint32(d+0x407a,true),21);assert.equal(view.getUint16(d+0x4088,true),4);}
 bound.close();return {pcm,writes,memory};
}
assert.deepEqual(continuationRun([5120]),continuationRun([1,17,100,333,4669]));
continuationRun([],true);
assert.deepEqual(continuationRun([5120],false,true),continuationRun([1,17,100,333,4669],false,true));
console.log('Explicit continuation binding sequences sample replacements at delivered IRQ positions with exact split-buffer PCM/bus/memory; pending close releases generator and attachment rejects before mutation');
{
 const memory=fixture();let began=false,ticks=0,release!:(()=>void);
 const bound=createMs91TandyRaceBinding(0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(){}});
 bound.attach(()=>memory,()=>{ticks++;if(!began){began=true;bound.sampleStarts([request],memory);}return [];});bound.render(512);
 assert.equal(bound.status(0),0);const before=ticks;
 const pending=bound.stopForResourceRelease(()=>new Promise<void>(resolve=>{release=resolve;}));
 assert.equal(bound.status(0),0,'Resource stop cannot fabricate transfer completion');
 assert.throws(()=>bound.attach(()=>fixture(),()=>[]),/pending replacement/);
 bound.render(16);assert.equal(bound.status(0),1);assert.equal(ticks,before,'Resource drain does not run new race callbacks');
 release();assert.equal(await pending,true);bound.attach(()=>fixture(),()=>[]);bound.close();
}
console.log('Resource-release stop retains busy until delivered IRQ, blocks attachment, suppresses new race callbacks and permits attachment only after completion');
for(const failure of ['abort','throw'] as const){
 const memory=fixture();let began=false;
 const bound=createMs91TandyRaceBinding(0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,busWrite(){}});
 bound.attach(()=>memory,()=>{if(!began){began=true;bound.sampleStarts([request],memory);}return [];});bound.render(512);
 const controller=new AbortController();
 if(failure==='throw')await assert.rejects(bound.stopForResourceRelease(async()=>{throw Error('Drain owner failure');}),/Drain owner failure/);
 else{const pending=bound.stopForResourceRelease(()=>new Promise<void>(()=>{}),controller.signal);controller.abort();assert.equal(await pending,false);}
 assert.equal(bound.status(0),0);assert.throws(()=>bound.attach(()=>fixture(),()=>[]),/stop is not complete/);
 assert.equal(await bound.stopForResourceRelease(async()=>{bound.render(16);}),true,'Explicit retry delivers stop IRQ before attachment');
 bound.attach(()=>fixture(),()=>[]);bound.close();
}
console.log('Cancelled/failed resource drains retain busy and prevent attachment; explicit retry completes through actual IRQ and releases ownership');
