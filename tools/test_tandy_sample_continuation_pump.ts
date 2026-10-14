import assert from 'node:assert/strict';
import {createTandySampleContinuationPump} from '../lib/game/tandy-sample-continuation-pump.ts';
import {createMs91TandySampleHost} from '../lib/game/ms91-tandy-sample-host.ts';
for(const differential of [false,true])for(const cancel of [false,true]){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);
 v.setUint16(0x2058c,0x2e9c,true);
 for(const offset of [0x100,0x200]){memory[0x30000+offset+4]=differential?6:0;v.setUint16(0x30000+offset+8,100,true);memory.fill(192,0x30000+offset+50,0x30000+offset+150);}
 const host=createMs91TandySampleHost(()=>memory,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,write(){},gameInterrupt(){}});
 const request={channel:0,offset:0x200,segment:0x3000,frequency:8000,repeats:1};
 host.start({...request,offset:0x100,repeats:0});
 let resumed=false,released=false;const positions:number[]=[];
 function* program(){try{yield {writes:[],bios:[],sampleStarts:[request]};resumed=true;return {writes:[],bios:[]};}finally{released=true;}}
 const pump=createTandySampleContinuationPump({write(){},bios(requests){assert.deepEqual(requests,[]);},status:host.status,requestStop:host.requestStop,start(value,position){positions.push(position);return host.start(value,position);}});
 assert.equal(pump.start(program(),10),false);assert.equal(host.status(0),0);assert.equal(resumed,false);
 assert.throws(()=>pump.start(program(),11),/already pending/);
 if(cancel){pump.close();host.advance(8);assert.equal(resumed,false);assert.deepEqual(positions,[]);}
 else{host.advance(8);assert.equal(host.status(0),1);assert.equal(pump.interrupt(18),true);assert.deepEqual(positions,[18]);assert.equal(resumed,true);assert.equal(host.status(0),0);pump.close();}
 assert.equal(released,true);assert.equal(pump.waiting,false);
}
console.log('Interrupt-driven continuation waits without freezing sample host, starts only after delivered stop IRQ at explicit position, and cancellation releases callback without replacement');
for(const boundary of ['write','bios','stop','status','start'] as const){
 let released=false;const calls:string[]=[];
 function* program(){try{yield {writes:[],bios:[],sampleStarts:[{channel:0,offset:0,segment:0,frequency:8000,repeats:1}]};assert.fail('Cancelled callback cannot resume');return {writes:[],bios:[]};}finally{released=true;}}
 const visit=(name:string)=>{calls.push(name);if(name===boundary)pump.close();};
 const pump=createTandySampleContinuationPump({write(){visit('write');},bios(){visit('bios');},requestStop(){visit('stop');return true;},status(){visit('status');return 1;},start(){visit('start');return true;}});
 assert.throws(()=>pump.start(program(),-1),/position/);assert.equal(pump.waiting,false,'Invalid position cannot capture callback ownership');
 assert.equal(pump.start(program(),0),false);assert.equal(pump.waiting,false);assert.equal(released,true);
 assert.equal(calls.at(-1),boundary,'Cancellation prevents subsequent owner operations');
}
console.log('Cancellation at write/BIOS/stop/status/start boundaries prevents further owner operations and releases generator; invalid start position takes no ownership');
for(const differential of [false,true]){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);v.setUint16(0x2058c,0x2e9c,true);
 v.setUint16(0x30108,100,true);memory.fill(192,0x30132,0x30196);
 memory[0x30204]=differential?6:0;v.setUint16(0x30208,0,true);
 const host=createMs91TandySampleHost(()=>memory,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,write(){},gameInterrupt(){}});
 const request={channel:0,offset:0x200,segment:0x3000,frequency:8000,repeats:1};
 host.start({...request,offset:0x100,repeats:0});let resumed=false,released=false;
 function* program(){try{yield {writes:[],bios:[],sampleStarts:[request]};resumed=true;return {writes:[],bios:[]};}finally{released=true;}}
 const pump=createTandySampleContinuationPump({write(){},bios(){},status:host.status,requestStop:host.requestStop,start:host.start});
 assert.equal(pump.start(program(),0),false);host.advance(8);assert.equal(pump.interrupt(8),true);
 assert.equal(host.status(0),1);assert.equal(resumed,true);assert.equal(released,true);assert.equal(pump.waiting,false);pump.close();
}
console.log('Original zero-length raw/differential sample callbacks return normally and resume race continuation without starting a transfer');
