import assert from 'node:assert/strict';
import {tandyDriverLayout} from '../lib/game/tandy-driver-layout.ts';
import {setOriginalTandyVolume,controlOriginalTandyChannel,assignOriginalTandyInstrument,originalTandyToneWrites,originalTandyVolumeWrites,setOriginalTandyFrequency,setOriginalTandyDivisor} from '../lib/game/tandy-control.ts';
for(const generation of ['ms-1990','ms-1991'] as const){
 const layout=tandyDriverLayout(generation),driver=new Uint8Array(layout.bytes),timer=new Uint8Array(72);
 for(let channel=0;channel<6;channel++){
  driver[layout.toneLatch+channel]=0x80+(channel<<4);driver[layout.volumeLatch+channel]=0x90+(channel<<4);
  for(let value=0;value<256;value++){
   setOriginalTandyVolume(driver,channel,value,generation);assert.equal(driver[layout.volume+channel],value>>>3);
   assert.deepEqual(originalTandyVolumeWrites(driver,channel,value,generation),[[0xc0,driver[layout.volumeLatch+channel]|((15-value)&255)]]);
  }
  timer[0x28]=111;assignOriginalTandyInstrument(driver,channel,timer,generation);assert.equal(driver[layout.volume+channel],13);
  controlOriginalTandyChannel(driver,channel,1,255,generation);assert.equal(driver[layout.volume+channel],13);
  controlOriginalTandyChannel(driver,channel,7,127,generation);assert.equal(driver[layout.volume+channel],15);
  assert.deepEqual(originalTandyToneWrites(driver,channel,65535,generation),[[0xc0,driver[layout.toneLatch+channel]|15],[0xc1,63]]);
 }
 const voice=new Uint8Array(46);setOriginalTandyFrequency(voice,0,1000,generation);
 assert.equal(voice[4]|voice[5]<<8,generation==='ms-1991'?Math.floor(0x1234dc0/1000):Math.floor(0x36b0000/1000));
 const divisor=generation==='ms-1991'?0x593:0x50c;driver[divisor]=255;driver[divisor+1]=255;
 setOriginalTandyDivisor(driver,voice,0,1234,generation);assert.equal(driver[divisor],0);assert.equal(driver[divisor+1],0);
}
assert.deepEqual(tandyDriverLayout(),tandyDriverLayout('ms-1990'));
const legacy=new Uint8Array(2993),explicit=legacy.slice();setOriginalTandyVolume(legacy,3,127);setOriginalTandyVolume(explicit,3,127,'ms-1990');assert.deepEqual(legacy,explicit);
console.log('Versioned Tandy controls: both gain/latch layouts,default legacy behavior,controller routing,frequency/divisor differences and3072 volume cases pass');
