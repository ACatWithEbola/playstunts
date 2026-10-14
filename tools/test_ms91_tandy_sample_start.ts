import assert from 'node:assert/strict';
import {startMs91TandySample,requestMs91TandySampleStop} from '../lib/game/ms91-tandy-sample-start.ts';
import {stepMs91TandySampleIrq} from '../lib/game/ms91-tandy-sample-irq.ts';
for(const differential of [false,true]){
 const memory=new Uint8Array(0x100000),view=new DataView(memory.buffer),base=0x20000,header=0x30100;
 view.setUint16(base+0x58c,0x2e9c,true);view.setUint16(0x20,0x1234,true);view.setUint16(0x22,0x5678,true);
 memory[header+4]=differential?6:0;view.setUint16(header+8,8,true);memory[header+0x32]=128;
 const request={channel:0,offset:0x100,segment:0x3000,frequency:0,repeats:0,picMask:0x80};
 const result=startMs91TandySample(memory,0x2000,request);
 assert.equal(result.started,true);assert.equal(view.getUint16(base+0x593,true),Math.floor(0x1234dc/100));
 assert.equal(view.getUint16(0x20,true),differential?0xae4:0xa66);
 const retained=memory.slice();assert.throws(()=>startMs91TandySample(memory,0x2000,request));assert.deepEqual(memory,retained);
 assert.equal(requestMs91TandySampleStop(memory,0x2000),false);
 stepMs91TandySampleIrq(memory,0x2000,differential);
 assert.equal(memory[base+0x595],0);assert.equal(view.getUint16(0x20,true),0x1234);assert.equal(view.getUint16(0x22,true),0x5678);
 assert.equal(requestMs91TandySampleStop(memory,0x2000),true);
 view.setUint16(header+8,0,true);assert.deepEqual(startMs91TandySample(memory,0x2000,request),{writes:[],started:false});
}
console.log('Modern Tandy sample lifecycle: explicit stop must complete before replacement,raw/differential startup,frequency clamp,vector restoration and zero-length handling pass');
