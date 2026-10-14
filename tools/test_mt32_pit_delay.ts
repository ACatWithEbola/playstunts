import assert from 'node:assert/strict';
import {delayMs91Mt32Pit} from '../lib/game/mt32-pit-delay.ts';
for(const ticks of [400,65000]){
 const threshold=65535-ticks,counts=[65535,threshold,threshold-1];let index=0,part=0,reads=0;const writes:number[][]=[];
 const generator=delayMs91Mt32Pit(ticks);let operation=generator.next();
 while(!operation.done){const o=operation.value;let result=0;
  if(o.kind==='write')writes.push([o.port,o.value]);
  else if(o.kind==='read'){
   if(o.port===0x61)result=0xaa;
   else{reads++;result=part?counts[index]>>8:counts[index]&255;if(part)index++;part^=1;}
  }else assert.fail('Unexpected delay operation');
  operation=generator.next(result);
 }
 assert.equal(reads,6);assert.deepEqual(writes,[[0x43,0xb6],[0x42,255],[0x42,255],[0x61,0xab],[0x43,0x80],[0x43,0x80],[0x43,0x80],[0x61,0xaa]]);
}
console.log('MS1991 Roland PIT delay retains port bits, low/high read order and inclusive countdown polling boundary');
