import assert from 'node:assert/strict';
import {createMs91TandySampleHost} from '../lib/game/ms91-tandy-sample-host.ts';
function run(blocks:number[],differential:boolean){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer),base=0x20000,header=0x30100;
 v.setUint16(base+0x58c,0x2e9c,true);v.setUint16(0x20,0x1234,true);v.setUint16(0x22,0x5678,true);
 memory[header+4]=differential?6:0;v.setUint16(header+8,6,true);memory.set([128,0x37,0x86,0xd9,0x2c,128],header+0x32);
 let elapsed=0,enabled=true;const writes:number[][]=[],game:number[]=[];
 const host=createMs91TandySampleHost(()=>memory,0x2000,{sampleRate:48000,picMask:0x80,interruptsEnabled:()=>enabled,write:(p,n,o)=>writes.push([p,n,elapsed+o]),gameInterrupt:o=>game.push(elapsed+o)});
 assert.equal(host.status(0),1);
 assert.equal(host.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1}),true);
 assert.equal(host.status(0),0);assert.equal(host.status(1),1);
 for(const count of blocks){host.advance(count);elapsed+=count;}
 assert.equal(memory[base+0x595],0);assert.equal(host.divisor,0x2e9c);assert.equal(host.picMask,0x80);
 assert.equal(host.status(0),1);
 assert.equal(v.getUint16(0x20,true),0x1234);assert.equal(v.getUint16(0x22,true),0x5678);
 enabled=false;assert.throws(()=>host.advance(1));
 return {writes,game,phase:host.phase,driver:[...memory.slice(base,base+3241)]};
}
for(const differential of [false,true])assert.deepEqual(run([4800],differential),run([17,100,333,4350],differential));
const memory=new Uint8Array(0x100000),view=new DataView(memory.buffer),base=0x20000,header=0x30100;
view.setUint16(base+0x58c,0x2e9c,true);view.setUint16(header+8,6,true);memory.set([128,129,130,131,132,133],header+0x32);
let fail=false,deliveries=0;
const broken=createMs91TandySampleHost(()=>memory,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
 write(port){deliveries++;if(fail&&port===0xc5)throw Error('Sample output disconnected');},gameInterrupt(){}});
broken.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1});fail=true;
assert.throws(()=>broken.advance(512),/disconnected/);
const snapshot=memory.slice(),count=deliveries;
assert.throws(()=>broken.advance(512),/host failed/);assert.throws(()=>broken.requestStop(),/host failed/);
assert.throws(()=>broken.start({channel:0,offset:0x100,segment:0x3000,frequency:8000,repeats:1}),/host failed/);
assert.deepEqual(memory,snapshot);assert.equal(deliveries,count);
console.log('Modern Tandy sample host: raw/differential transfers,restored timer/PIC/vector,game IRQ chaining and fractional clock phase are invariant across split audio blocks');
{
 const memory=new Uint8Array(0x100000);new DataView(memory.buffer).setUint16(0x2058c,0x2e9c,true);let ticks=0;
 const host=createMs91TandySampleHost(()=>memory,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,write(){},gameInterrupt(){ticks++;}});
 host.writeBus(0x43,0x36);host.writeBus(0x40,0x4e);host.writeBus(0x40,0x17);
 assert.equal(host.divisor,5966);host.advance(48000);assert.equal(ticks,199);
 const phase=host.phase;host.writeBus(0x21,1);assert.equal(host.picMask,1);assert.throws(()=>host.advance(100),/enabled IRQ0/);assert.equal(host.phase,phase);
 host.writeBus(0x21,0);host.advance(48000);assert.equal(ticks,399);
 assert.throws(()=>host.writeBus(0x21,256),/bus write/);assert.equal(host.picMask,0);
}
console.log('Caller PIT0/PIC bus writes update the owning clock and mask; rejected masked delivery advances no time, valid unmask resumes retained phase');
