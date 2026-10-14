import {createOriginalTandyDacClock} from './tandy-dac-clock.ts';
/** Fine-grained request timeline, before audio-frame quantization. CPU/BIOS
 * owner supplies elapsed chip clocks and simultaneous-event order. Callback
 * programming affects subsequent edges in this span, not already emitted ones.
 * No CPU duration, arbitration or automatic IRQ policy is selected here. */
export function createLegacyTandyChipTimeline(divisor:number,volume:number,request:(tick:number)=>void){
 const clock=createOriginalTandyDacClock(divisor,volume);
 let tick=0,closed=false,failed=false,advancing=false;
 const healthy=()=>{if(closed||failed)throw Error('Legacy Tandy chip timeline unavailable');};
 return {
  snapshot:()=>({...clock.snapshot(),tick}),
  program(divisor:number,volume:number){healthy();clock.program(divisor,volume);},
  write(port:number,value:number){healthy();clock.write(port,value);},
  skipIdle(clocks:number){healthy();if(advancing||!Number.isSafeInteger(clocks)||clocks<0||!Number.isSafeInteger(tick+clocks))throw Error('Invalid legacy Tandy idle span');clock.skipClocks(clocks);tick+=clocks;},
  advance(clocks:number){
   healthy();if(advancing||!Number.isSafeInteger(clocks)||clocks<0||!Number.isSafeInteger(tick+clocks))throw Error('Invalid legacy Tandy chip timeline span');
   advancing=true;
   try{let left=clocks;while(left){healthy();const count=Math.min(left,clock.snapshot().remaining),edges=clock.advanceClocks(count);tick+=count;left-=count;if(edges.length){request(tick);healthy();}}}
   catch(error){failed=true;throw error;}finally{advancing=false;}
  },
  close(){closed=true;},
 };
}
