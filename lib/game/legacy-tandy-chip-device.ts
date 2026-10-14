import {createLegacyTandyChipTimeline} from './legacy-tandy-chip-timeline.ts';
import {createOriginalTandyDacTransfer,type TandySegmentCountProfile} from './tandy-dac-transfer.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
/** Fine-clock legacy device. CPU owner supplies elapsed clocks, DMA grants and
 * enabled service windows. No BIOS execution duration/automatic CPU return.
 * Terminal count and interrupt delivery remain separate, including repeats. */
export function createLegacyTandyChipDevice(readByte:(address:number)=>number,supplied:{
 divisor:number;volume:number;grant(tick:number):boolean;
 segmentCountProfile?:TandySegmentCountProfile;
 byte?(tick:number,value:number,volume:number):void;
 completion(ax:number,tick:number):void;
}){
 const options={...supplied},transfer=createOriginalTandyDacTransfer(readByte,{pauseAt64KiB:true,segmentCountProfile:options.segmentCountProfile});
 const pending:Array<'segment'|'completion'>=[];
 let closed=false,failed=false,delivering=false;
 const healthy=()=>{if(closed||failed)throw Error('Legacy Tandy chip device unavailable');};
 const timeline=createLegacyTandyChipTimeline(options.divisor,options.volume,tick=>{
  healthy();const granted=options.grant(tick);healthy();if(typeof granted!=='boolean')throw Error('Legacy chip DMA grant must be boolean');if(!granted)return;
  const byte=transfer.transferByte();healthy();if(!byte)return;
  if(byte.segmentBoundary)pending.push('segment');if(byte.completion!==null)pending.push('completion');
  options.byte?.(tick,byte.value,byte.volume);healthy();
 });
 return {
  snapshot(){return {clock:timeline.snapshot(),transfer:transfer.snapshot(),pending:[...pending]};},
  status(){healthy();return transfer.status();},
  play(request:OriginalTandyBiosSound){healthy();const copy={...request};for(const key of ['ax','es','bx','cx','dx'] as const)if(!Number.isInteger(copy[key])||copy[key]<0||copy[key]>65535)throw Error('Invalid legacy chip BIOS word');if(copy.ax>>>8!==0x83||(copy.ax&255)>7||copy.cx<1||copy.dx<1||copy.dx>4095)throw Error('Invalid legacy chip playback request');const result=transfer.play(copy);if(!result.carry)timeline.program(copy.dx,copy.ax&255);return result;},
  write(port:number,value:number){healthy();timeline.write(port,value);transfer.write(port,value);},
  advance(clocks:number){healthy();try{timeline.advance(clocks);}catch(error){failed=true;pending.length=0;timeline.close();throw error;}},
  /** Explicit owner fast path only when no buffer can consume DMA. Pending
   * IRQs stay queued; caller must split at any CPU/BIOS action in the span. */
  skipIdle(clocks:number){healthy();if(transfer.snapshot())throw Error('Cannot skip active legacy DMA');timeline.skipIdle(clocks);},
  /** Caller explicitly models the BIOS/CPU's enabled IRQ window. */
  serviceInterrupt(enabled:boolean){
   healthy();if(typeof enabled!=='boolean')throw Error('Explicit legacy interrupt-enable state required');
   if(delivering)throw Error('Legacy chip completion delivery reentry');
   if(!enabled||pending.length===0)return false;
   const kind=pending.shift()!;delivering=true;
   try{if(kind==='segment')transfer.resumeSegment();else options.completion(0x91fb,timeline.snapshot().tick);healthy();return true;}
   catch(error){failed=true;pending.length=0;timeline.close();throw error;}finally{delivering=false;}
  },
  close(){if(closed)return;closed=true;pending.length=0;timeline.close();},
 };
}
