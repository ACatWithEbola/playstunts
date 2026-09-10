/** Original1651e..165ab /166b6..1673d held fast-forward/rewind step.
 * Accumulator is a signed long; the elapsed-time product is truncated to
 * a signed word before addition, as in the executable. */
export function originalReplayScrubStep(accumulator:number,delta:number,recorded:number,position:number,direction:'forward'|'backward'){
 const s16=(n:number)=>n<<16>>16;
 accumulator|=0;recorded&=65535;position&=65535;delta&=65535;
 const speed=Math.min(s16(Math.trunc(accumulator/50)+3),100);
 accumulator=(accumulator+s16(s16(delta)*speed))|0;
 const available=direction==='forward'?(recorded-position)&65535:position;
 if((Math.trunc(accumulator/20)&65535)>available)accumulator=available*20;
 const distance=Math.trunc(accumulator/20)&65535;
 return {accumulator,target:(position+(direction==='forward'?distance:-distance))&65535,delay:delta};
}
