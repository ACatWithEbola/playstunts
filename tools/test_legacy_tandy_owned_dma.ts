import assert from 'node:assert/strict';
import {createLegacyTandyMixedAudio} from '../lib/game/legacy-tandy-mixed-audio.ts';

function fixture(owned:boolean){
 const reads:number[]=[],done:number[]=[];
 let retained:Parameters<Parameters<typeof createLegacyTandyMixedAudio>[1]['gameInterrupt']>[1]|undefined;
 const mixed=createLegacyTandyMixedAudio(address=>{reads.push(address);return [0,64,128,255][address];},{
  sampleRate:48000,tone:{variant:'pssj3',clockHz:3579545,psgGain:0,speakerGain:0},sampleGain:1,
  initialByte:128,initialVolume:0,decodeByte:value=>(value-128)/128,deferCompletionInterrupts:true,
  completion(ax,frame){assert.equal(ax,0x91fb);done.push(frame);},
  gameInterrupt(frame,bus){retained=bus;if(frame===1){bus.grantDma();bus.grantDma();}else if(frame===3){bus.grantDma();bus.grantDma();bus.grantDma();}else bus.deliverCompletionInterrupt();},
 });
 mixed.scheduleBios(0,{ax:0x8307,es:0,bx:0,cx:4,dx:123});
 if(owned){mixed.scheduleGameInterrupt(1);mixed.scheduleGameInterrupt(3);mixed.scheduleGameInterrupt(4);}
 else {for(const frame of [1,1,3,3,3])mixed.scheduleDma(frame);mixed.scheduleCompletionInterrupt(4);}
 return {mixed,reads,done,retained:()=>retained};
}
const scheduled=fixture(false),owned=fixture(true),split=fixture(true);
const pcm=scheduled.mixed.render(6);
assert.deepEqual(owned.mixed.render(6),pcm);
assert.deepEqual([...split.mixed.render(1),...split.mixed.render(2),...split.mixed.render(3)],[...pcm]);
assert.deepEqual([...pcm],[0,-0.5,-0.5,127/128,127/128,127/128]);
for(const item of [scheduled,owned,split]){
 assert.deepEqual(item.reads,[0,1,2,3]);assert.deepEqual(item.done,[4]);
 assert.equal(item.mixed.pendingCompletionInterrupts,0);
 if(item.retained())assert.throws(()=>item.retained()!.grantDma(),/no owning boundary/);
 item.mixed.close();
 if(item.retained())assert.throws(()=>item.retained()!.grantDma(),/unavailable/);
 assert.deepEqual(item.reads,[0,1,2,3]);
}
console.log('Owned DMA grants retain coincident byte order and exact scheduled/split PCM; idle grants read nothing, retained bus and closed playback reject further grants');
