import assert from 'node:assert/strict';
import {createLegacyTandyContinuationPump} from '../lib/game/legacy-tandy-continuation-pump.ts';
for(const mode of ['return','cancel','failure'] as const){
 let resumed=false,released=false;const events:number[][]=[];
 const first={ax:0x8300,es:0x2000,bx:0x50f,cx:1,dx:1},second={ax:0x8307,es:0x3000,bx:0x132,cx:6,dx:600};
 function* program(){try{yield {writes:[[0xc6,88]],bios:[first],sampleStarts:[]};resumed=true;yield {writes:[],bios:[second],sampleStarts:[]};return {writes:[[0x61,0]],bios:[]};}finally{released=true;}}
 const pump=createLegacyTandyContinuationPump({write(writes,position){for(const [port,value]of writes)events.push([position,port,value]);},bios(request,position){events.push([position,request.ax,request.cx]);if(request.cx===6&&mode==='failure')throw Error('BIOS fault');return request.cx===6;}});
 assert.throws(()=>pump.start(program(),-1),/position/);assert.equal(pump.waiting,false);
 assert.equal(pump.start(program(),10),false);assert.equal(resumed,false);assert.equal(released,false);assert.equal(pump.waitingForBiosReturn,true);
 assert.throws(()=>pump.start(program(),11),/already pending/);
 if(mode==='cancel'){pump.cancel();assert.equal(resumed,false);assert.throws(()=>pump.biosReturned(20),/No pending/);}
 else if(mode==='failure')assert.throws(()=>pump.biosReturned(20),/BIOS fault/);
 else{assert.equal(pump.biosReturned(20),true);assert.deepEqual(events,[[10,0xc6,88],[10,0x8300,1],[20,0x8307,6],[20,0x61,0]]);}
 assert.equal(pump.waiting,false);assert.equal(released,true);pump.close();
}
{
 let replacementEntered=false,released=false;
 function* replacement(){replacementEntered=true;return {writes:[],bios:[]};}
 function* original(){try{yield {writes:[],bios:[],sampleStarts:[]};assert.fail('Cancelled program must not resume');return {writes:[],bios:[]};}finally{released=true;}}
 const pump=createLegacyTandyContinuationPump({write(){pump.cancel();assert.throws(()=>pump.start(replacement(),1),/reentry/);},bios(){assert.fail('No BIOS request expected');}});
 assert.equal(pump.start(original(),0),false);
 assert.equal(released,true);assert.equal(replacementEntered,false);assert.equal(pump.waiting,false,'Rejected reentrant start must not adopt replacement program');pump.close();
}
console.log('Legacy CPU pump resumes only on explicit BIOS return, preserves boundary positions and releases on cancellation/failure; rejects reentrant ownership before adoption; no DMA or latency invented');
