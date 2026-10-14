import assert from 'node:assert/strict';
import {createBrowserModernTandyBackend} from '../lib/game/browser-modern-tandy-backend.ts';
import {createMs91TandyRaceBinding} from '../lib/game/ms91-tandy-race-binding.ts';
for(const device of [undefined,{kind:'adlib' as const},{kind:'tandy' as const,port61:()=>0,interruptCx:()=>0,bios(){}},{kind:'tandy' as const,driverGeneration:'ms-1990' as const,port61:()=>0,interruptCx:()=>0,bios(){}}])assert.equal(createBrowserModernTandyBackend(48000,device),undefined);
for(const rate of [44100,48000]){
 const binding=createBrowserModernTandyBackend(rate,{kind:'tandy',driverGeneration:'ms-1991',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('Modern direct-DAC backend must not execute legacy BIOS');}})!;
 assert.equal(binding.sampleRate,rate);assert.throws(()=>binding.render(1),/not attached/);binding.close();
}
console.log('Modern Tandy backend selection uses explicit sound-driver identity, preserves legacy/non-Tandy path and requires attachment before rendering');
function run(rate:number,differential:boolean,useFactory:boolean,blocks:number[]){
 const memory=new Uint8Array(0x100000),view=new DataView(memory.buffer),base=0x39e10,header=0x50100;
 view.setUint16(base+0x58c,0x2e9c,true);view.setUint16(0x20,0x1234,true);view.setUint16(0x22,0x5678,true);
 memory[header+4]=differential?6:0;view.setUint16(header+8,4000,true);for(let i=0;i<4000;i++)memory[header+50+i]=(i*37)&255;
 const masks:number[]=[];
 const binding=useFactory?createBrowserModernTandyBackend(rate,{kind:'tandy',driverGeneration:'ms-1991',port61:()=>0,interruptCx:()=>0,bios(){assert.fail('No modern BIOS');}})!:createMs91TandyRaceBinding(0x39e1,{sampleRate:rate,picMask:0,interruptsEnabled:()=>true,initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:b=>(b-128)/128,tone:{variant:'pssj3',clockHz:3579545,psgGain:.5,speakerGain:1},sampleGain:.5,busWrite(port,value){if(port===0x21)masks.push(value);}});
 let ticks=0,started=false;
 binding.attach(()=>memory,()=>{ticks++;if(!started){binding.sampleStarts([{channel:0,offset:0x100,segment:0x5000,frequency:8000,repeats:1}],memory);started=true;}else if(binding.status(0)===0)binding.requestStop();return [[0xc0,ticks%2?0x90:0x9f]];});
 const pcm:number[]=[];for(const count of blocks)pcm.push(...binding.render(count));
 assert.ok(started);assert.ok(ticks>1);assert.equal(binding.status(0),1);assert.ok(pcm.some(v=>v!==0));
 if(!useFactory){assert.ok(masks.length>0);assert.equal(masks.at(-1)!&1,0,'Atomic sample programming restores enabled IRQ0 before further rendering');}
 binding.close();return {pcm,memory,ticks};
}
for(const rate of [44100,48000])for(const differential of [false,true]){
 const expected=run(rate,differential,false,[6000]);assert.deepEqual(run(rate,differential,true,[6000]),expected);assert.deepEqual(run(rate,differential,true,[1,17,100,333,5549]),expected);
}
console.log('Modern backend raw/differential start/stop restores enabled IRQ boundary and matches reference PCM, complete memory and game-clock counts at44100/48000 across splits');
