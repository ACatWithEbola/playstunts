import {createLegacyTandyFineRaceBinding} from './legacy-tandy-fine-race-binding.ts';
type Options=Parameters<typeof createLegacyTandyFineRaceBinding>[1];
/** Opt-in deterministic virtual device, not an SL/2 CPU cycle model.
 * BIOS calls return atomically except the verified muted one-byte DX1 reset:
 * its next actual DMA event and completion are serviced before return.
 * IRQ delivery is enabled at device boundaries; no physical arbitration claim.
 */
export function createLegacyTandyVirtualRaceBinding(readByte:(address:number)=>number,options:Omit<Options,'bios'|'grant'>){
 const sampleRate=options.sampleRate,clockHz=options.clockHz;
 const binding=createLegacyTandyFineRaceBinding(readByte,{...options,grant:()=>true,
  bios(request,_tick,bus){
   const result=bus.play(request);
   if(!result.carry&&request.ax===0x8300&&request.cx===1&&request.dx===1){
    bus.advanceToNextRequest();bus.serviceInterrupt(true);
   }
   return true;
  },
 });
 return {
  profile:'legacy-tandy-virtual' as const,
  ...binding,
  get waiting(){return binding.waiting;},
  get waitingForBiosReturn(){return binding.waitingForBiosReturn;},
  get port61(){return binding.port61;},
  render(frames:number){
   const cursor=binding.snapshot().audio.cursor;
   const product=(cursor+frames)*clockHz;
   if(!Number.isSafeInteger(frames)||frames<0||!Number.isSafeInteger(cursor+frames)||!Number.isSafeInteger(product))throw Error('Invalid virtual Tandy render span');
   // Tone integration covers the entire last sample interval, not only its
   // sampling point. Round coverage upward consistently across block splits.
   const target=Math.ceil(product/sampleRate);
   if(frames)while(binding.serviceInterrupt(true)){}
   // Absolute coverage accounts for clocks already advanced inside BIOS callbacks.
   while(binding.snapshot().device.clock.tick<target){
    const clock=binding.snapshot().device.clock;
    if(!binding.status().carry){binding.skipIdle(target-clock.tick);break;}
    binding.advance(Math.min(clock.remaining,target-clock.tick));
    while(binding.serviceInterrupt(true)){}
   }
   return binding.render(frames);
  },
 };
}
