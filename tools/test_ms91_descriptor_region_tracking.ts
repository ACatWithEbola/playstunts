import assert from 'node:assert/strict';
import {renderOriginalModelMemory} from '../lib/game/render-model-memory.ts';
import {MODEL_DISPLAY_LAYOUTS} from '../lib/game/model-display-layout.ts';
function run(flags:number,strict:boolean){
 const memory=new Uint8Array(0x100000),d=0x20000,v=new DataView(memory.buffer),put=(at:number,n:number)=>v.setUint16(d+at,n&65535,true),record=0x100,model=0x1000,region=0x2000;
 put(record+6,model);put(record+8,region);put(record+16,300);memory[d+record+18]=flags;
 put(model,4);put(model+2,0);put(model+4,0x5000);memory[d+model+8]=1;
 put(model+10,0);put(model+12,0x6000);put(model+14,0);put(model+16,0x6100);put(model+18,0);put(model+20,0x6200);
 for(const [i,point] of [[0,[-50,-50,1000]],[1,[50,-50,1000]],[2,[50,50,1000]],[3,[-50,50,1000]]] as [number,number[]][])point.forEach((n,axis)=>v.setInt16(0x50000+i*6+axis*2,n,true));
 memory.set([5,0,0,0,0],0x60000);v.setUint32(0x61000,1,true);memory[d+0x3275]=1;memory[d+0x3285]=5;
 for(let i=0;i<9;i++)put(0xaa5c+i*2,i%4===0?16384:0);
 for(const [at,n] of [[0x4b88,160],[0x4b8a,100],[0x4b8c,100],[0x4b8e,100],[0x556a,0],[0x556c,320],[0x556e,0],[0x5570,200],[0x558c,0],[0x558e,0x7000],[0x5f32,0xbeef]])put(at,n);
 [320,0,200,0].forEach((n,i)=>put(region+i*2,n));const before=memory.slice(d+region,d+region+8);
 const cache={vectors:Array.from({length:256},()=>[0,0,0] as [number,number,number]),points:Array.from({length:256},()=>[0,0]),flags:Array(256).fill(0)};
 const result=renderOriginalModelMemory(memory,d,record,cache,undefined,undefined,MODEL_DISPLAY_LAYOUTS.mcga,strict);
 assert.ok(result.drawCount>0,'Visible primitive must be emitted');
 const tracked=!strict||!!(flags&8);assert.equal(v.getUint16(d+0x5f32,true),tracked?region:0xbeef);
 if(tracked)assert.notDeepEqual(memory.slice(d+region,d+region+8),before);else assert.deepEqual(memory.slice(d+region,d+region+8),before);
 return result.drawCount;
}
assert.equal(run(2,true),run(10,true));run(2,false);
console.log('Visible model primitive honors descriptor08 region tracking while the default legacy path retains existing behavior');
