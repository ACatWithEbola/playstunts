import assert from 'node:assert/strict';
import {createLegacyTandyMixedAudio} from '../lib/game/legacy-tandy-mixed-audio.ts';
for(const owned of [false,true])for(const cross of [false,true])for(const repeat of [false,true]){
 let completions=0,segment=false,playCarry:number|undefined;const trace:number[]=[];
 const request={ax:0x8307,es:cross?0x3fff:0,bx:cross?14:0,cx:4,dx:4095};
 const mixed=createLegacyTandyMixedAudio(()=>128,{sampleRate:48000,tone:{variant:'pssj3',clockHz:3579545,psgGain:0,speakerGain:0},sampleGain:1,initialByte:128,initialVolume:0,decodeByte:b=>(b-128)/128,deferCompletionInterrupts:true,pauseAt64KiB:true,
  biosResult(result){playCarry??=Number(result.carry);},segmentBoundary(){segment=true;},completion(ax,_frame,bus){assert.equal(ax,0x91fb);completions++;if(repeat&&completions===1)assert.equal(bus.play(request).carry,false);},
  gameInterrupt(frame,bus){if(owned&&dma.includes(frame)){bus.grantDma();return;}if(frame===5)trace.push(playCarry!,completions);if(segment){bus.resumeDmaSegment();segment=false;}else if(mixed.pendingCompletionInterrupts)bus.deliverCompletionInterrupt();if(frame===5)trace.push(Number(bus.status().carry),completions);},
 });
 mixed.scheduleBios(0,request);
 const dma=cross?[1,2,6,7,9,10,12,13]:[1,2,3,4,6,7,8,9];
 const windows=cross?[5,8,11,14]:[5,10];
 const events=[...dma.map(frame=>({frame,kind:'dma'})),...windows.map(frame=>({frame,kind:'window'}))].sort((a,b)=>a.frame-b.frame);
 for(const event of events)if(event.kind==='dma'&&!owned)mixed.scheduleDma(event.frame);else mixed.scheduleGameInterrupt(event.frame);
 mixed.render(15);trace.push(completions);assert.deepEqual(trace,cross?[0,0,1,0,repeat?2:1]:[0,0,repeat?1:0,1,repeat?2:1]);assert.equal(mixed.pendingCompletionInterrupts,0);mixed.close();
}
console.log('Legacy owning-window replay matches four captured flat/boundary/repeat BIOS status and completion-order traces; explicit event positions, not measured timing');
