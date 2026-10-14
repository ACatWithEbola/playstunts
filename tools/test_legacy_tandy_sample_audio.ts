import assert from 'node:assert/strict';
import {createLegacyTandySampleAudio} from '../lib/game/legacy-tandy-sample-audio.ts';
const memory=new Uint8Array(0x100000);memory.set([128,255,0],0x10000);
const completed:number[][]=[];
const profile={initialByte:128,initialVolume:7,decodeByte:(value:number)=>(value-128)/128,completion:(ax:number,frame:number)=>{completed.push([ax,frame]);}};
const audio=createLegacyTandySampleAudio(address=>memory[address],profile);
profile.decodeByte=()=>{assert.fail('Caller mutation cannot replace active decoder');};profile.completion=()=>{assert.fail('Caller mutation cannot replace completion owner');};profile.initialByte=0;profile.initialVolume=0;
const request={ax:0x8307,es:0x1000,bx:0,cx:3,dx:123};
assert.equal(audio.play(request).carry,false);assert.equal(audio.play({...request,bx:2}).carry,true,'Busy request cannot replace current data');
audio.dmaEdge(2);audio.dmaEdge(4);audio.dmaEdge(6);
assert.deepEqual(audio.render(4),new Float32Array([0,0,0,0]));
memory[0x10002]=192;
assert.deepEqual(audio.render(4),new Float32Array([127/128,127/128,0.5,0.5]));
assert.deepEqual(completed,[[0x91fb,6]]);assert.equal(audio.status().carry,false);
audio.dmaEdge(9);audio.render(2);assert.equal(completed.length,1);
audio.write(0xc7,0);assert.deepEqual(audio.render(2),new Float32Array([0,0]),'Volume zero silences the held sample without another DMA byte');
audio.write(0xc7,0xe0);assert.deepEqual(audio.render(2),new Float32Array([0.5,0.5]),'Gain restore reuses the retained DAC sample');
assert.throws(()=>audio.write(0xc7,256),/register byte/);assert.deepEqual(audio.render(1),new Float32Array([0.5]));
audio.close();assert.throws(()=>audio.render(1),/unavailable/);
let reads=0;const failed=createLegacyTandySampleAudio(()=>{reads++;throw Error('DMA read failed');},{initialByte:0,initialVolume:0,decodeByte:value=>value,completion(){}});
failed.play(request);failed.dmaEdge(0);assert.throws(()=>failed.render(1),/DMA read failed/);assert.throws(()=>failed.render(1),/unavailable/);assert.equal(reads,1);
console.log('Legacy Tandy PCM honors externally timed DMA edges, live sample bytes, busy rejection and one completion event; failed/closed streams reject reuse, no BIOS latency assumption');
for(const caught of [true,false]){
 let completions=0,reads=0;
 const stream=createLegacyTandySampleAudio(()=>{reads++;return 192;},{initialByte:128,initialVolume:7,decodeByte:value=>(value-128)/128,completion(){
  completions++;if(caught)assert.throws(()=>stream.render(1),/already active/);else stream.render(1);
 }});
 stream.play({...request,cx:1});stream.dmaEdge(2);
 if(caught){assert.deepEqual(stream.render(4),new Float32Array([0,0,0.5,0.5]));assert.deepEqual(stream.render(2),new Float32Array([0.5,0.5]));}
 else{assert.throws(()=>stream.render(4),/already active/);assert.throws(()=>stream.render(1),/unavailable/);}
 assert.equal(completions,1);assert.equal(reads,1);stream.close();
}
console.log('Legacy completion callback cannot recursively consume DMA/buffer state; caught rejection preserves outer output, propagated error prevents reuse');
{
 let reads=0,completions=0;
 const stream=createLegacyTandySampleAudio(()=>{reads++;return 192;},{initialByte:128,initialVolume:7,decodeByte:value=>(value-128)/128,completion(){completions++;stream.close();}});
 stream.play({...request,cx:1});stream.dmaEdge(2);stream.dmaEdge(3);
 assert.throws(()=>stream.render(4),/unavailable/,'Completion-triggered close cannot return further PCM');
 assert.equal(reads,1);assert.equal(completions,1);assert.throws(()=>stream.render(1),/unavailable/);
}
console.log('Completion-triggered close stops the current PCM render before further DMA/output');
for(const boundary of ['read','decode']){
 let reads=0,decodes=0,completions=0;
 const stream=createLegacyTandySampleAudio(()=>{reads++;if(boundary==='read')stream.close();return 192;},{initialByte:128,initialVolume:7,decodeByte(value){if(value===192){decodes++;if(boundary==='decode')stream.close();}return (value-128)/128;},completion(){completions++;}});
 stream.play({...request,cx:1});stream.dmaEdge(2);
 assert.throws(()=>stream.render(4),/unavailable/);assert.equal(reads,1);assert.equal(decodes,boundary==='read'?0:1);assert.equal(completions,0,'Closed callback owner cannot dispatch completion');
}
