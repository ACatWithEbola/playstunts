import {completeOriginalTandySample} from './tandy-sample.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
/** The supplied banks never allocate DAC channel0. TD15 still submits a
 * one-byte, zero-volume request after clearing its sample-active flag.
 * Completion then returns without modifying the driver or issuing a repeat.
 * Its DMA/IRQ latency is unobservable to this restricted tone-only path;
 * this is not a general BIOS or sample scheduler. */
export function serviceSuppliedTandySilentRequests(requests:OriginalTandyBiosSound[],memory:Uint8Array,driverSegment=0x39e1){
 const driver=memory.subarray(driverSegment*16,driverSegment*16+2993);
 if(driver.length!==2993)throw Error('Missing Tandy driver for BIOS sound request');
 for(const r of requests){
  if(r.ax!==0x8300||r.es!==driverSegment||r.bx!==0x50f||r.cx!==1||r.dx!==1||driver[0x504]!==0)throw Error('Tandy sampled playback requires the full DAC host');
  const result=completeOriginalTandySample(driver,0x91fb);
  if(result.chain||result.bios.length)throw Error('Unexpected Tandy silent completion work');
 }
}
