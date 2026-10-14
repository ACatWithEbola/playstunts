import {createOriginalTandyDacClock} from './tandy-dac-clock.ts';
/** Map explicitly selected chip clocks to audio sample boundaries. Returned
 * edges are requests, not completed DMA transfers or delivered CPU interrupts.
 * The owner still supplies DMA arbitration, BIOS work and coincident bus order. */
export function createTandyDacSampleClock(sampleRate:number,clockHz:number,divisor:number,volume:number){
 if(!Number.isSafeInteger(sampleRate)||sampleRate<8000||!Number.isSafeInteger(clockHz)||clockHz<1||!Number.isSafeInteger(clockHz+sampleRate))throw Error('Invalid Tandy chip/sample clock profile');
 const chip=createOriginalTandyDacClock(divisor,volume);
 let phase=0;
 return {
  snapshot:()=>({...chip.snapshot(),phase}),
  program(divisor:number,volume:number){chip.program(divisor,volume);},
  write(port:number,value:number){chip.write(port,value);},
  advance(frames:number){
   if(!Number.isSafeInteger(frames)||frames<0)throw Error('Invalid Tandy sample clock span');
   const offsets:number[]=[];
   for(let offset=1;offset<=frames;offset++){
    phase+=clockHz;const clocks=Math.floor(phase/sampleRate);phase-=clocks*sampleRate;
    for(const _ of chip.advanceClocks(clocks))offsets.push(offset);
   }
   return offsets;
  },
 };
}
