import {ORIGINAL_PIT_DIVISOR,PC_PIT_INPUT_HZ} from './timer-interrupt.ts';

/** Locate original IRQ boundaries in an audio block, without rounding the
 * original divisor to 100 Hz or to an integer number of samples per tick.
 * Offsets are sample counts to generate before invoking the audio callback.
 */
export function audioTimerSampleOffsets(phase:number,samples:number,sampleRate:number){
 if(!Number.isSafeInteger(sampleRate)||sampleRate<=0||!Number.isSafeInteger(samples)||samples<0)throw Error('Invalid audio sample clock');
 const period=ORIGINAL_PIT_DIVISOR*sampleRate;
 if(period<PC_PIT_INPUT_HZ)throw Error('Audio sample rate must exceed the callback rate');
 if(!Number.isSafeInteger(period)||!Number.isSafeInteger(phase)||phase<0||phase>=period||!Number.isSafeInteger(phase+samples*PC_PIT_INPUT_HZ))throw Error('Audio clock exceeds exact integer range');
 const offsets:number[]=[];
 let position=0;
 while(position<samples){
  const until=Math.ceil((period-phase)/PC_PIT_INPUT_HZ);
  if(until>samples-position){phase+=(samples-position)*PC_PIT_INPUT_HZ;break;}
  position+=until;phase+=until*PC_PIT_INPUT_HZ-period;offsets.push(position);
 }
 return {phase,offsets};
}
