import assert from 'node:assert/strict';
import {stepMs91TandySampleIrq} from '../lib/game/ms91-tandy-sample-irq.ts';
const base=0x20000;
function fixture(){const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);const put=(at:number,n:number)=>v.setUint16(base+at,n,true);for(const [at,n] of [[0x578,8],[0x57a,0x3000],[0x57c,32],[0x57e,8],[0x580,0x3000],[0x588,0x1234],[0x58a,0x5678],[0x58c,0xabcd],[0x58e,31],[0x590,5]])put(at,n);memory[base+0x595]=1;memory[base+0x592]=0x80;return {memory,v,put};}
{
 const {memory,v}=fixture();memory[0x30008]=0x3c;
 const result=stepMs91TandySampleIrq(memory,0x2000,true);
 assert.deepEqual(result,{writes:[[0x21,0xfc],[0xc5,248],[0x20,0x20]],returnKind:'iret'});
 assert.equal(v.getUint16(base+0x57e,true),9);assert.equal(memory[base+0x5a6],255);
 const second=stepMs91TandySampleIrq(memory,0x2000,true);
 assert.deepEqual(second.writes,[[0x21,0xfc],[0xc5,253],[0x20,0x20]]);assert.equal(v.getUint16(base+0x57e,true),9);
}
for(const differential of [false,true]){
 const {memory,v,put}=fixture();put(0x57e,32);put(0x590,1);memory[base+0x582]=1;memory[0x30008]=234;
 const result=stepMs91TandySampleIrq(memory,0x2000,differential);
 assert.deepEqual(result,{writes:[[0x21,0xfc],[0x43,0x36],[0x40,0xcd],[0x40,0xab],[0xc4,0],[0x21,0x80]],returnKind:'chain',vector:{offset:0x1234,segment:0x5678}});
 assert.equal(memory[base+0x595],0);assert.equal(memory[base+0x582],0);
 assert.equal(v.getUint16(0x20,true),0x1234);assert.equal(v.getUint16(0x22,true),0x5678);
 assert.equal(v.getUint16(base+0x590,true),31);assert.equal(v.getUint16(base+0x57e,true),differential?9:8);
 assert.equal(memory[0x30008],234);
}
assert.throws(()=>stepMs91TandySampleIrq(new Uint8Array(1024),0x2000,false));
console.log('Modern Tandy IRQ: high/low sample phase,stop boundary,repeat countdown,timer/PIC/vector restoration and chain target pass; invalid memory rejects');
