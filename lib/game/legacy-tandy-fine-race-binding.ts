import {createLegacyTandyChipDevice} from './legacy-tandy-chip-device.ts';
import {createLegacyTandyContinuationPump} from './legacy-tandy-continuation-pump.ts';
import {createTandyChipPcmProjection} from './tandy-chip-pcm-projection.ts';
import {originalTandyDacGain,type TandySegmentCountProfile} from './tandy-dac-transfer.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import {createTandyChipToneProjection} from './tandy-chip-tone-projection.ts';
import type {OriginalTandyToneOutputOptions} from './tandy-tone-audio.ts';
type Program=Parameters<ReturnType<typeof createLegacyTandyContinuationPump>['start']>[0];
export interface LegacyTandyFineBus {
 play(request:OriginalTandyBiosSound):{ax:number;carry:boolean};
 status():{ax:number;carry:boolean};
 serviceInterrupt(enabled:boolean):boolean;
 advance(clocks:number):void;
 advanceToNextRequest():number;
}
/** Unified ownership for explicitly timed legacy race CPU/device/sample PCM.
 * Caller supplies BIOS execution/return policy, grants and tone output.
 * This does not select a machine profile or attach an autonomous game timer. */
export function createLegacyTandyFineRaceBinding(readByte:(address:number)=>number,supplied:{
 sampleRate:number;clockHz:number;divisor:number;volume:number;initialByte:number;
 decodeByte(value:number):number;sampleGain:number;grant(tick:number):boolean;
 segmentCountProfile?:TandySegmentCountProfile;
 bios(request:OriginalTandyBiosSound,tick:number,bus:LegacyTandyFineBus):boolean;
 completion(ax:number,tick:number,bus:LegacyTandyFineBus):void;
 byte?(tick:number,value:number,volume:number):void;
 busWrite?(port:number,value:number,tick:number):void;
 toneWrites(writes:number[][],tick:number):void;
 /** Omitted leaves tone ownership external; supplied mixes it exactly once. */
 tone?:OriginalTandyToneOutputOptions;
}){
 const options={...supplied,tone:supplied.tone?{...supplied.tone}:undefined};
 if(options.tone&&options.tone.clockHz!==options.clockHz)throw Error('Fine Tandy tone/device clocks must match');
 if(!Number.isInteger(options.initialByte)||options.initialByte<0||options.initialByte>255||!Number.isFinite(options.sampleGain)||options.sampleGain<0)throw Error('Invalid fine Tandy sample profile');
 let value=options.decodeByte(options.initialByte),volume=options.volume,closed=false,failed=false,busDepth=0,port61=0;
 const level=()=>value*originalTandyDacGain(volume)*options.sampleGain;
 const projection=createTandyChipPcmProjection(options.sampleRate,options.clockHz,level());
 const tones=options.tone?createTandyChipToneProjection(options.sampleRate,options.tone):undefined;
 const healthy=()=>{if(closed||failed)throw Error('Fine Tandy race binding unavailable');};
 const owned=()=>{healthy();if(busDepth===0)throw Error('Fine Tandy bus has no owning callback boundary');};
 const withBus=<T>(action:()=>T):T=>{healthy();busDepth++;try{const result=action();healthy();return result;}finally{busDepth--;}};
 const record=()=>{healthy();projection.record(device.snapshot().clock.tick,level());};
 const device=createLegacyTandyChipDevice(readByte,{divisor:options.divisor,volume:options.volume,grant:options.grant,segmentCountProfile:options.segmentCountProfile,
  byte(tick,byte,gain){value=options.decodeByte(byte);healthy();if(!Number.isFinite(value))throw Error('Invalid fine Tandy sample decode');volume=gain;record();options.byte?.(tick,byte,gain);healthy();},
  completion(ax,tick){withBus(()=>options.completion(ax,tick,bus));},
 });
 const bus:LegacyTandyFineBus={
  play(request){owned();const result=device.play(request);if(!result.carry){volume=request.ax&255;record();}return result;},
  status(){owned();return device.status();},
  serviceInterrupt(enabled){owned();return device.serviceInterrupt(enabled);},
  advance(clocks){owned();device.advance(clocks);},
  advanceToNextRequest(){owned();const clocks=device.snapshot().clock.remaining;device.advance(clocks);return clocks;},
 };
 const deliverWrites=(supplied:number[][])=>{healthy();const writes=supplied.map(pair=>pair.slice());for(const pair of writes){if(pair.length!==2||![0xc0,0xc1,0x40,0x42,0x43,0x61,0xc6,0xc7].includes(pair[0])||!Number.isInteger(pair[1])||pair[1]<0||pair[1]>255)throw Error('Invalid fine Tandy port write');}
  for(const [port,byte] of writes){healthy();if(port===0xc6||port===0xc7){device.write(port,byte);if(port===0xc7){volume=byte>>>5;record();}}else{if(port===0x61)port61=byte;tones?.write(device.snapshot().clock.tick,port,byte);options.toneWrites([[port,byte]],device.snapshot().clock.tick);}healthy();options.busWrite?.(port,byte,device.snapshot().clock.tick);healthy();}};
 const pump=createLegacyTandyContinuationPump({
  write:deliverWrites,
  bios(request){return withBus(()=>options.bios(request,device.snapshot().clock.tick,bus));},
 });
 const close=()=>{if(closed)return;closed=true;try{pump.close();}finally{device.close();projection.close();tones?.close();}};
 const operate=<T>(action:()=>T):T=>{healthy();try{return action();}catch(error){failed=true;close();throw error;}};
 return {
  sampleRate:options.sampleRate,
  get port61(){return port61;},
  get waiting(){return pump.waiting;},get waitingForBiosReturn(){return pump.waitingForBiosReturn;},
  snapshot:()=>({device:device.snapshot(),audio:projection.snapshot(),tone:tones?.snapshot(),port61}),
  start(program:Program){return operate(()=>pump.start(program,device.snapshot().clock.tick));},
  biosReturned(){return operate(()=>pump.biosReturned(device.snapshot().clock.tick));},
  status(){return operate(()=>device.status());},
  write(writes:number[][]){operate(()=>deliverWrites(writes));},
  advance(clocks:number){operate(()=>device.advance(clocks));},
  skipIdle(clocks:number){operate(()=>device.skipIdle(clocks));},
  serviceInterrupt(enabled:boolean){return operate(()=>device.serviceInterrupt(enabled));},
  render(frames:number){return operate(()=>{const covered=device.snapshot().clock.tick,output=projection.render(frames,covered),tone=tones?.render(frames,covered);if(tone)for(let index=0;index<frames;index++)output[index]+=tone[index];if(output.some(value=>!Number.isFinite(value)))throw Error('Nonfinite fine Tandy mixed output');return output;});},
  close,
 };
}
