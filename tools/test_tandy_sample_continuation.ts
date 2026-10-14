import assert from 'node:assert/strict';
import {runTandySampleContinuation} from '../lib/game/run-tandy-sample-continuation.ts';
type Program=Parameters<typeof runTandySampleContinuation>[0];
for(const mode of ['complete','cancel','reject','throw'] as const){
 const events:string[]=[],controller=new AbortController();let released=false;
 const request={channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1};
 function* program(){try{
  events.push('enter');
  yield {writes:[[0xc7,0]],bios:[],sampleStarts:[request]};
  events.push('resume');return {writes:[[0xc7,0xe0]],bios:[]};
 }finally{released=true;}}
 const pending=runTandySampleContinuation(program() as Program,{
  write(writes){for(const [,value]of writes)events.push(`write:${value}`);},
  bios(requests){assert.deepEqual(requests,[]);},
  async replaceSample(value,signal){assert.deepEqual(value,request);assert.equal(signal,controller.signal);events.push('wait');await Promise.resolve();
   if(mode==='throw')throw Error('Owner failed');
   if(mode==='cancel')controller.abort();
   return mode!=='reject';
  },
 },controller.signal);
 if(mode==='throw')await assert.rejects(pending,/Owner failed/);
 else assert.equal(await pending,mode==='complete');
 assert.equal(released,true);
 assert.deepEqual(events,mode==='complete'?['enter','write:0','wait','resume','write:224']:['enter','write:0','wait']);
}
console.log('Suspended Tandy callback delivers boundary writes before replacement, resumes only after success and releases continuation on cancellation/rejection/failure; owner timing remains explicit');
for(const mode of ['complete','cancel','failure'] as const){
 const events:string[]=[],controller=new AbortController();let released=false;
 const boundary={writes:[[0xc7,17]],bios:[],sampleStarts:[{channel:0,offset:256,segment:12288,frequency:8000,repeats:1}]};
 let releaseWrite!:()=>void;
 const wait=new Promise<void>(resolve=>{releaseWrite=resolve;});
 function* program(){try{yield boundary;events.push('resume');return {writes:[],bios:[]};}finally{released=true;}}
 const pending=runTandySampleContinuation(program() as Program,{
  async write(writes){events.push('write');assert.deepEqual(writes,events.length===1?[[0xc7,17]]:[]);if(events.length===1)await wait;},
  async bios(requests,signal){events.push('bios');assert.equal(signal,controller.signal);assert.deepEqual(requests,[]);if(mode==='failure')throw Error('BIOS delivery failed');if(mode==='cancel')controller.abort();},
  async replaceSample(request){events.push('sample');assert.equal(request.frequency,8000);return true;},
 },controller.signal);
 assert.deepEqual(events,['write']);assert.equal(released,false);
 boundary.sampleStarts[0].frequency=1;boundary.writes[0][1]=99;
 releaseWrite();
 if(mode==='failure')await assert.rejects(pending,/BIOS delivery failed/);
 else assert.equal(await pending,mode==='complete');
 assert.equal(released,true);
 assert.deepEqual(events,mode==='complete'?['write','bios','sample','resume','write','bios']:['write','bios']);
}
console.log('Asynchronous write/BIOS ownership preserves boundary snapshots and prevents resume after cancellation or failed delivery');
