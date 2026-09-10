/** Tandy 1000 TL technical reference, PSSJ specification sections6.2/7:
 * either C6 or C7 write reloads the new sound channel's divider. The host
 * supplies chip-clock edges and register writes in their actual order.
 * This does not choose BIOS latency, DMA arbitration, interrupt delivery,
 * zero-divisor behavior, or the power-on register contents. */
export function createOriginalTandyDacClock(initialDivisor:number,initialVolume:number){
 const validate=(divisor:number,volume:number)=>{
  if(!Number.isInteger(divisor)||divisor<1||divisor>4095)throw RangeError('Unresolved Tandy DAC clock divisor');
  if(!Number.isInteger(volume)||volume<0||volume>7)throw RangeError('Invalid Tandy DAC clock volume');
 };
 validate(initialDivisor,initialVolume);
 let divisor=initialDivisor,volume=initialVolume,remaining=divisor;
 return {
  snapshot:()=>({divisor,volume,remaining}),
  write(port:number,value:number){
   if(port!==0xc6&&port!==0xc7)throw Error('Expected Tandy DAC frequency/amplitude port');
   if(!Number.isInteger(value)||value<0||value>255)throw RangeError('Invalid Tandy DAC register byte');
   const next=port===0xc6?(divisor&0xf00)|value:(divisor&255)|((value&15)<<8),amplitude=port===0xc7?(value>>>5)&7:volume;
   validate(next,amplitude);divisor=next;volume=amplitude;remaining=divisor;
  },
  /** Return divider output edges as offsets from the start of this span.
   * A caller with a simultaneous bus write must split the span at that
   * externally determined boundary, rather than guessing event priority. */
  advanceClocks(clocks:number){
   if(!Number.isSafeInteger(clocks)||clocks<0)throw RangeError('Invalid Tandy DAC clock span');
   const edges:number[]=[];let offset=0;
   while(clocks>=remaining){offset+=remaining;clocks-=remaining;edges.push(offset);remaining=divisor;}
   remaining-=clocks;return edges;
  },
 };
}
