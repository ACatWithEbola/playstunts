import assert from 'node:assert/strict';
import {applyOriginalMt32DriverControl} from '../lib/game/mt32-driver-control.ts';
import {createMt32MusicWriteProgram} from '../lib/game/mt32-music-write-program.ts';
import {executeTimedMt32Program} from '../lib/game/timed-mt32-program.ts';
import {createMt32PitTransportHost} from '../lib/game/mt32-pit-transport-host.ts';
for(const generation of ['ms-1990','ms-1991'] as const)for(let channel=0;channel<16;channel++){
 const patch=new Uint8Array(100);patch[18]=12;patch[68]=7;patch[69]=100;patch[70]=64;
 const expected=applyOriginalMt32DriverControl('instrument',channel,new Uint8Array(46),patch,0,0,generation).writes;
 const actual:number[][]=[];let clocks=0;
 const host=createMt32PitTransportHost({read:()=>0,write:(port,value)=>{actual.push([port,value]);},interrupts(){},delay(){},cancelled:()=>false},{initialPort61:0,now:()=>clocks,async poll(){clocks++;}});
 await executeTimedMt32Program(createMt32MusicWriteProgram(new Uint8Array(1750),expected,generation),host);
 assert.deepEqual(actual,expected);assert.equal(clocks,generation==='ms-1991'?4*201+32501:0);
 const broken=expected.map(pair=>pair.slice());if(generation==='ms-1991'){
  assert.throws(()=>createMt32MusicWriteProgram(new Uint8Array(1750),broken.slice(0,8),generation),/Incomplete/);
  const checksum=broken.findIndex(pair=>pair[1]===0xf7)-1;broken[checksum][1]^=1;
  assert.throws(()=>createMt32MusicWriteProgram(new Uint8Array(1750),broken,generation),/Invalid/);
 }
}
console.log('32 instrument callback packets retain exact MIDI order; modern four-payload/packet PIT waits and malformed-packet rejection pass with virtual clocks');
