import assert from 'node:assert/strict';
import {createMs91TandySampleHost} from '../lib/game/ms91-tandy-sample-host.ts';
import {createMs91TandySampleReplacement} from '../lib/game/ms91-tandy-sample-replacement.ts';
for(const differential of [false,true])for(const cancel of [false,true]){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),base=0x20000;
 v.setUint16(base+0x58c,0x2e9c,true);v.setUint16(0x20,0x1234,true);v.setUint16(0x22,0x5678,true);
 v.setUint16(0x30108,100,true);memory.fill(192,0x30132,0x30132+100);
 memory[0x30104]=differential?6:0;
 v.setUint16(0x30208,6,true);memory.set([128,55,134,217,44,128],0x30232);
 const host=createMs91TandySampleHost(()=>memory,0x2000,{sampleRate:48000,picMask:0x80,interruptsEnabled:()=>true,write(){},gameInterrupt(){}});
 host.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:0});
 const controller=new AbortController();let waits=0;
 const replace=createMs91TandySampleReplacement(host,async()=>{waits++;assert.equal(host.status(0),0);host.advance(8);if(cancel)controller.abort();});
 const request={channel:0,offset:0x200,segment:0x3000,frequency:8000,repeats:1};
 const before=memory.slice();await assert.rejects(replace({...request,frequency:-1}),/replacement word/);assert.deepEqual(memory,before);
 const pending=replace(request,controller.signal);
 request.offset=0x999;request.frequency=123;request.repeats=0;
 await assert.rejects(replace(request),/already in progress/);
 assert.equal(await pending,!cancel);assert.ok(waits>0);
 assert.equal(host.status(0),cancel?1:0);
 if(!cancel){assert.equal(v.getUint16(base+0x578,true),0x232);assert.equal(memory[base+0x582],1,'Pending replacement owns its repeat count');host.advance(512);assert.equal(host.status(0),1);}
 else{assert.equal(v.getUint16(base+0x578,true),0x132);assert.equal(v.getUint16(0x20,true),0x1234);}
 host.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:0});
 let failWait=true;
 const retry=createMs91TandySampleReplacement(host,async()=>{if(failWait){failWait=false;throw Error('Injected IRQ wait failure');}host.advance(8);});
 const next={channel:0,offset:0x200,segment:0x3000,frequency:8000,repeats:1};
 await assert.rejects(retry(next),/IRQ wait failure/);assert.equal(host.status(0),0,'Failed wait cannot fabricate transfer completion');
 assert.equal(await retry(next),true,'Failed wait releases coordinator ownership for an explicit retry');
 host.advance(512);assert.equal(host.status(0),1);
 v.setUint16(0x30308,0,true);memory[0x30304]=differential?6:0;
 host.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:0});
 assert.equal(await retry({...next,offset:0x300}),true,'Empty replacement completes callback normally rather than cancellation');
 assert.equal(host.status(0),1,'Zero-length replacement starts no transfer');
}
console.log('Modern sample replacement waits for delivered stop IRQ, rejects concurrent/invalid work and cancels without starting a new transfer; explicit virtual IRQ owner');
{
 const controller=new AbortController();let starts=0,stops=0,rejectWait!:(error:Error)=>void;
 const replace=createMs91TandySampleReplacement({requestStop(){stops++;return false;},status:()=>0,start(){starts++;return true;}},()=>new Promise<void>((resolve,reject)=>{rejectWait=reject;}));
 const pending=replace({channel:0,offset:0,segment:0,frequency:8000,repeats:1},controller.signal);
 controller.abort();assert.equal(await pending,false);assert.equal(starts,0);assert.equal(stops,1);
 // A late owner failure is consumed even though cancellation already ended
 // this continuation. It must not become an unhandled rejection/new start.
 rejectWait(Error('Late interrupt-owner failure'));await Promise.resolve();assert.equal(starts,0);
}
console.log('Cancellation settles a replacement even with an unresolved IRQ wait; late owner rejection is handled and no new sample starts');
for(const caught of [true,false]){
 const memory=new Uint8Array(0x100000);new DataView(memory.buffer).setUint16(0x2058c,0x2e9c,true);
 let interrupts=0;
 const host=createMs91TandySampleHost(()=>memory,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,write(){},gameInterrupt(){
  interrupts++;const phase=host.phase,before=memory.slice();
  if(caught){assert.throws(()=>host.advance(1),/already active/);assert.equal(host.phase,phase);assert.deepEqual(memory,before);}
  else host.advance(1);
 }});
 if(caught){host.advance(512);host.advance(512);assert.ok(interrupts>1);}
 else{assert.throws(()=>host.advance(512),/already active/);assert.throws(()=>host.advance(1),/host failed/);}
}
console.log('Underlying Tandy clock rejects recursive advancement before phase/memory mutation; handled rejection retains host, propagated callback failure prevents reuse');
