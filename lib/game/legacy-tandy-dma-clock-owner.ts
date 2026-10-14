import {createTandyDacSampleClock} from './tandy-dac-sample-clock.ts';
/** Chip-request owner, separate from BIOS/PIC service. The outer hardware
 * owner must call each sample boundary in order and supply arbitration.
 * Requests denied by arbitration are not transferred or silently retried.
 * This does not select BIOS latency, IRQ priority or initial register values. */
export function createLegacyTandyDmaClockOwner(profile:{sampleRate:number;clockHz:number;divisor:number;volume:number},grant:(frame:number)=>boolean){
 const clock=createTandyDacSampleClock(profile.sampleRate,profile.clockHz,profile.divisor,profile.volume);
 let frame=0,requests=0,grants=0,closed=false,failed=false,executing=false;
 const healthy=()=>{if(closed||failed)throw Error('Legacy Tandy clock owner unavailable');};
 return {
  snapshot:()=>({...clock.snapshot(),frame,requests,grants}),
  program(divisor:number,volume:number){healthy();if(executing)throw Error('Legacy Tandy clock programming during request delivery');clock.program(divisor,volume);},
  write(port:number,value:number){healthy();if(executing)throw Error('Legacy Tandy clock write during request delivery');clock.write(port,value);},
  service(nextFrame:number){
   healthy();if(executing||!Number.isSafeInteger(nextFrame)||nextFrame!==frame+1)throw Error('Legacy Tandy clock requires consecutive sample boundaries');
   executing=true;
   try{const edges=clock.advance(1);frame=nextFrame;for(const _ of edges){healthy();requests++;const accepted=grant(frame);healthy();if(typeof accepted!=='boolean')throw Error('Legacy Tandy DMA arbitration must return a boolean');if(accepted)grants++;}}
   catch(error){failed=true;throw error;}finally{executing=false;}
  },
  close(){closed=true;},
 };
}
