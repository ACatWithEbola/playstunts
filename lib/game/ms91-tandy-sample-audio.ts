import {createOriginalTandyDirectDac} from './tandy-direct-dac.ts';
import {createMs91TandySampleHost} from './ms91-tandy-sample-host.ts';
/** Explicit direct-DAC sample hold at the host's delivered IRQ boundaries.
 * Caller owns reset contents, normalized byte conversion and CPU/PIC window.
 * No analog filter, BIOS timing or DMA scheduling is fabricated. */
export function createMs91TandySampleAudio(memory:()=>Uint8Array,segment:number,supplied:{
 sampleRate:number;picMask:number;interruptsEnabled():boolean;
 initialDac:Parameters<typeof createOriginalTandyDirectDac>[0];
 decodeByte(value:number):number;write(port:number,value:number,offset:number):void;
 gameInterrupt(offset:number):void;
 afterInterrupt?(offset:number):void;
}){
 const options={...supplied,initialDac:{...supplied.initialDac}};
 const dac=createOriginalTandyDirectDac(options.initialDac);
 let buffer:Float32Array|undefined,position=0,failed=false,closed=false;
 const healthy=()=>{if(closed||failed)throw Error('Tandy sample audio is unavailable');};
 const fill=(end:number)=>{
  healthy();
  if(!buffer){if(end!==0)throw Error('Tandy sample write is outside render');return;}
  if(!Number.isSafeInteger(end)||end<position||end>buffer.length)throw Error('Invalid Tandy sample delivery position');
  const sample=dac.sample(),value=sample?options.decodeByte(sample.value)*sample.gain:0;
  healthy();
  if(!Number.isFinite(value))throw Error('Invalid Tandy sample conversion');
  buffer.fill(value,position,end);position=end;
 };
 const host=createMs91TandySampleHost(memory,segment,{...options,write(port,value,offset){
  healthy();
  if(port>=0xc4&&port<=0xc7){fill(offset);dac.write(port,value);}
  options.write(port,value,offset);
  healthy();
 },gameInterrupt(offset){healthy();options.gameInterrupt(offset);healthy();},afterInterrupt(offset){healthy();options.afterInterrupt?.(offset);healthy();}});
 const operate=<T>(action:()=>T)=>{healthy();try{return action();}catch(error){failed=true;throw error;}};
 return {start:(request:Parameters<typeof host.start>[0])=>operate(()=>{if(buffer)throw Error('Tandy sample start during render requires an explicit position');return host.start(request);}),
  writeBus(port:number,value:number){return operate(()=>{if(buffer)throw Error('Tandy external bus write during render');host.writeBus(port,value);});},
  writeBusAt(port:number,value:number,offset:number){return operate(()=>{fill(offset);host.writeBus(port,value,offset);});},
  /** The owning game IRQ supplies its position; validate before driver mutation. */
  startAt(request:Parameters<typeof host.start>[0],offset:number){
   healthy();if(!buffer||!Number.isSafeInteger(offset)||offset<position||offset>buffer.length)throw Error('Invalid Tandy sample start position');
   return operate(()=>{fill(offset);return host.start(request,offset);});
  },
  /** Caller delivers these between render spans at its actual bus boundary. */
  writeDac(port:number,value:number){
   return operate(()=>{if(buffer)throw Error('Tandy external DAC write during rendering');dac.write(port,value);options.write(port,value,0);});
  },
  /** Delivered by the owning chained IRQ at an explicit position in this span. */
  writeDacAt(port:number,value:number,offset:number){return operate(()=>{fill(offset);dac.write(port,value);options.write(port,value,offset);});},
  requestStop:()=>operate(()=>host.requestStop()),status:(channel:number)=>host.status(channel),
  render(frames:number){
   healthy();if(buffer)throw Error('Tandy sample render is already active');if(!Number.isSafeInteger(frames)||frames<0)throw Error('Invalid Tandy sample frame count');
   return operate(()=>{buffer=new Float32Array(frames);position=0;try{host.advance(frames);fill(frames);return buffer;}finally{buffer=undefined;}});
  },close(){closed=true;buffer=undefined;},
 };
}
