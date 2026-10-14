import {createLegacyTandyMixedAudio} from './legacy-tandy-mixed-audio.ts';
import {createLegacyTandyContinuationPump} from './legacy-tandy-continuation-pump.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
type MixOptions=Parameters<typeof createLegacyTandyMixedAudio>[1];
type Bus=Parameters<MixOptions['gameInterrupt']>[1];
/** Explicitly scheduled legacy race bridge. Caller owns BIOS execution,
 * DMA arbitration and completion interrupt delivery. No autonomous timer,
 * reset profile or guessed event priority is selected here. */
export function createLegacyTandyRaceBinding(readByte:(address:number)=>number,supplied:Omit<MixOptions,'gameInterrupt'>&{
 program():Parameters<ReturnType<typeof createLegacyTandyContinuationPump>['start']>[0];
 nestedInterrupt(frame:number):void;
 bios(request:OriginalTandyBiosSound,frame:number,bus:Bus):boolean;
 /** Device service boundary; does not advance the game or resume its CPU. */
 hardwareInterrupt?(frame:number,bus:Bus):void;
}){
 const options={...supplied,tone:{...supplied.tone}};
 let bus:Bus|undefined,closed=false,failed=false;
 const callbacks:Array<'game'|'return'|'hardware'>=[];
 const healthy=()=>{if(closed||failed)throw Error('Legacy Tandy race binding unavailable');};
 const pump=createLegacyTandyContinuationPump({
  write(writes){if(!bus)throw Error('Legacy race write outside owning boundary');bus.write(writes);},
  bios(request,frame){if(!bus)throw Error('Legacy race BIOS outside owning boundary');return options.bios(request,frame,bus);},
 });
 const mixed=createLegacyTandyMixedAudio(readByte,{...options,gameInterrupt(frame,nextBus){
  bus=nextBus;try{
   const kind=callbacks.shift();if(!kind)throw Error('Missing legacy race boundary');
   if(kind==='hardware')options.hardwareInterrupt!(frame,nextBus);
   else if(kind==='return')pump.biosReturned(frame);
   else if(pump.waiting)options.nestedInterrupt(frame);
   else pump.start(options.program(),frame);
  }finally{bus=undefined;}
 }});
 const fail=(error:unknown):never=>{failed=true;pump.close();mixed.close();callbacks.length=0;throw error;};
 const schedule=(kind:'game'|'return'|'hardware',frame:number)=>{healthy();mixed.scheduleGameInterrupt(frame);callbacks.push(kind);};
 return {
  sampleRate:options.sampleRate,get port61(){return mixed.port61;},get waiting(){return pump.waiting;},
  scheduleGameInterrupt(frame:number){schedule('game',frame);},scheduleBiosReturn(frame:number){schedule('return',frame);},
  scheduleHardwareInterrupt(frame:number){healthy();if(!options.hardwareInterrupt)throw Error('Missing legacy hardware service owner');schedule('hardware',frame);},
  scheduleDma(frame:number){healthy();mixed.scheduleDma(frame);},
  get pendingCompletionInterrupts(){return mixed.pendingCompletionInterrupts;},
  scheduleCompletionInterrupt(frame:number){healthy();mixed.scheduleCompletionInterrupt(frame);},
  write(writes:number[][]){healthy();try{mixed.write(writes);}catch(error){fail(error);}},
  render(frames:number){healthy();try{return mixed.render(frames);}catch(error){return fail(error);}},
  close(){if(closed)return;closed=true;pump.close();mixed.close();callbacks.length=0;},
 };
}
