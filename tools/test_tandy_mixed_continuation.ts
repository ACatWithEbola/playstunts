import assert from 'node:assert/strict';
import {createMs91TandyMixedAudio} from '../lib/game/ms91-tandy-mixed-audio.ts';
import {createTandySampleContinuationPump} from '../lib/game/tandy-sample-continuation-pump.ts';
function run(blocks:number[],differential:boolean){
 const memory=new Uint8Array(0x100000),v=new DataView(memory.buffer);v.setUint16(0x2058c,0x2e9c,true);
 for(const offset of [0x100,0x200]){memory[0x30000+offset+4]=differential?6:0;v.setUint16(0x30000+offset+8,100,true);memory.fill(192,0x30000+offset+50,0x30000+offset+150);}
 let elapsed=0,begun=false,resumed=false;const writes:number[][]=[],starts:number[]=[];
 let pump:ReturnType<typeof createTandySampleContinuationPump>;
 const request={channel:0,offset:0x200,segment:0x3000,frequency:8000,repeats:1};
 function* program(){yield {writes:[[0xc0,0x90]],bios:[],sampleStarts:[request]};resumed=true;return {writes:[[0xc7,0xe0]],bios:[]};}
 const mixed=createMs91TandyMixedAudio(()=>memory,0x2000,{sampleRate:48000,picMask:0,interruptsEnabled:()=>true,
  initialDac:{mode:0,data:128,frequencyLow:0,amplitudeFrequency:0xe0},decodeByte:value=>(value-128)/128,
  tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},sampleGain:0.5,
  gameInterrupt(position){if(!begun){begun=true;pump.start(program(),position);}else if(resumed)mixed.requestStop();return [];},
  afterInterrupt(position){if(pump.waiting)pump.interrupt(position);},busWrite(port,value,position){writes.push([port,value,elapsed+position]);}});
 pump=createTandySampleContinuationPump({write:(values,position)=>mixed.writeAt(values,position),bios(values){assert.deepEqual(values,[]);},status:mixed.status,requestStop:mixed.requestStop,start(value,position){starts.push(elapsed+position);return mixed.startAt(value,position);}});
 mixed.start({...request,offset:0x100,repeats:0});
 const pcm=new Float32Array(blocks.reduce((a,b)=>a+b,0));
 for(const frames of blocks){pcm.set(mixed.render(frames),elapsed);elapsed+=frames;}
 assert.equal(resumed,true);assert.equal(starts.length,1);assert.ok(starts[0]>0);assert.ok(pcm.every(Number.isFinite));
 assert.ok(writes.every((value,index)=>index===0||value[2]>=writes[index-1][2]));
 pump.close();mixed.close();return {pcm,writes,starts,memory};
}
for(const differential of [false,true])assert.deepEqual(run([5120],differential),run([1,17,100,333,4669],differential));
console.log('Interrupt-driven replacement through mixed tone/DAC audio is identical across split buffers: PCM, actual replacement offset, bus writes and full memory; explicit virtual hardware');
