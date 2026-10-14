import assert from 'node:assert/strict';
import {createTandyChipToneProjection} from '../lib/game/tandy-chip-tone-projection.ts';
import {createOriginalTandyToneAudio} from '../lib/game/tandy-tone-audio.ts';
const writes=[[0xc0,0x84],[0xc1,8],[0xc0,0x90],[0xc0,0xbf],[0xc0,0xdf],[0xc0,0xff],[0x43,0xb6],[0x42,0x98],[0x42,0xa],[0x61,3]];
for(const rate of [44100,48000]){
 const profile={variant:'pssj3' as const,clockHz:3579545,psgGain:0.5,speakerGain:1},reference=createOriginalTandyToneAudio(rate,profile),fine=createTandyChipToneProjection(rate,profile);
 for(const [port,value] of writes){reference.write(port,value);fine.write(0,port,value);}
 const expected=reference.render(256),actual=fine.render(256,30000);let error=0;
 for(let index=0;index<256;index++)error=Math.max(error,Math.abs(expected[index]-actual[index]));assert.ok(error<1e-7,`Existing tone output error ${error}`);fine.close();
 const fixture=()=>{const owner=createTandyChipToneProjection(rate,profile);for(const [port,value] of writes)owner.write(0,port,value);owner.write(17,0xc0,0x9f);owner.write(81,0x61,0);owner.write(100,0xc0,0x90);return owner;};
 const whole=fixture(),split=fixture();assert.deepEqual([...whole.render(256,30000)],[...split.render(1,30000),...split.render(9,30000),...split.render(246,30000)]);assert.deepEqual(whole.snapshot(),split.snapshot());
 assert.throws(()=>whole.write(0,0xc0,0x90),/Invalid/);whole.close();split.close();
 const uncovered=fixture(),before=uncovered.snapshot();assert.throws(()=>uncovered.render(256,0),/coverage/);assert.deepEqual(uncovered.snapshot(),before);uncovered.close();
 const pulse=createTandyChipToneProjection(rate,{...profile,psgGain:1,speakerGain:0});for(const [port,value] of [[0xc0,0x84],[0xc1,8],[0xc0,0x90],[0xc0,0xbf],[0xc0,0xdf],[0xc0,0xff]])pulse.write(0,port,value);pulse.write(17,0xc0,0x9f);
 // First PSG divided edge is16; output is high only on [16,17) before mute.
 const first=pulse.render(1,100)[0],analytic=Math.fround(Math.exp(-2*Math.PI*20/rate)*(8191/32768)/(3579545/rate));assert.equal(first,analytic);pulse.close();
 console.log(`${rate}: fine PSG/PIT tone integration matches existing output within ${error}, exact split events/filter state and coverage guards`);
}
