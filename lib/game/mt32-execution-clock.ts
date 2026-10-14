import {PC_PIT_INPUT_HZ} from './timer-interrupt.ts';

/** Explicit 8086 nominal-instruction profile, not a recovered PC wall clock.
 * Intel 8086 Family User's Manual (1979), table 2-21: DEC reg16=2,
 * JNZ taken=16 / not taken=4 CPU clocks. Bus/prefetch/IRQ costs belong
 * to the selecting host and are not silently supplied here. */
export function createMt32ExecutionClock(profile:{cpuHz:number;pollCycles:number}){
 for(const value of [profile.cpuHz,profile.pollCycles]){
  if(!Number.isSafeInteger(value)||value<=0)throw Error('Invalid Roland CPU clock profile');
 }
 const frequency=BigInt(profile.cpuHz),pollCycles=BigInt(profile.pollCycles);
 let numerator=BigInt(0);
 const bounded=(value:bigint)=>{
  if(value>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Roland execution clock overflow');
  return Number(value);
 };
 const advanceCycles=(cycles:bigint)=>{
  const next=numerator+cycles*BigInt(PC_PIT_INPUT_HZ);
  bounded(next/frequency);numerator=next;
 };
 return {
  now:()=>bounded(numerator/frequency),
  advanceTo(clock:number){
   if(!Number.isSafeInteger(clock)||clock<0)throw Error('Invalid Roland execution clock target');
   const target=BigInt(clock)*frequency;
   // Retain sub-PIT-clock phase when synthesis catches up to the same tick.
   if(target>numerator)numerator=target;
  },
  async poll(){advanceCycles(pollCycles);},
  delay(loop:'decrement-dx',iterations:number){
   if(loop!=='decrement-dx'||!Number.isSafeInteger(iterations)||iterations<1||iterations>65536)throw Error('Invalid Roland CPU delay');
   const count=BigInt(iterations);
   advanceCycles(count*BigInt(2)+(count-BigInt(1))*BigInt(16)+BigInt(4));
  },
 };
}
