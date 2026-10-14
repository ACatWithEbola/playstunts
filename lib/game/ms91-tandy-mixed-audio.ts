import {createOriginalTandyToneAudio,type OriginalTandyToneOutputOptions} from './tandy-tone-audio.ts';
import {createMs91TandySampleAudio} from './ms91-tandy-sample-audio.ts';
/** Shared modern sample/tone bus. Sample host alone owns PIT0/IRQ chaining;
 * tones are rendered without a second independent music clock. Caller owns
 * CPU/PIC delivery, reset contents, normalized DAC mapping and mix gains. */
export function createMs91TandyMixedAudio(memory:()=>Uint8Array,segment:number,supplied:
 Omit<Parameters<typeof createMs91TandySampleAudio>[2],'write'|'gameInterrupt'|'afterInterrupt'>&{
 tone:OriginalTandyToneOutputOptions;sampleGain:number;
 gameInterrupt(offset:number):number[][];
 afterInterrupt?(offset:number):void;
 busWrite(port:number,value:number,offset:number):void;
 }){
 const options={...supplied,tone:{...supplied.tone},initialDac:{...supplied.initialDac}};
 if(!Number.isFinite(options.sampleGain)||options.sampleGain<0)throw Error('Invalid Tandy sample mix gain');
 const tone=createOriginalTandyToneAudio(options.sampleRate,options.tone);
 tone.write(0x43,0xb6);
 let buffer:Float32Array|undefined,position=0,closed=false,failed=false,gameIrqPosition:number|undefined;
 const healthy=()=>{if(closed||failed)throw Error('Tandy mixed audio unavailable');};
 const fillTone=(end:number)=>{
  if(!buffer){if(end!==0)throw Error('Tandy tone write outside render');return;}
  if(end<position||end>buffer.length)throw Error('Invalid Tandy tone write position');
  buffer.set(tone.render(end-position),position);position=end;
 };
 const isTone=(port:number)=>[0xc0,0xc1,0x42,0x43,0x61,0x40].includes(port);
 const samples=createMs91TandySampleAudio(memory,segment,{...options,
  afterInterrupt(offset){fillTone(offset);gameIrqPosition=offset;try{options.afterInterrupt?.(offset);}finally{gameIrqPosition=undefined;}},
  write(port,value,offset){if(isTone(port)){fillTone(offset);tone.write(port,value);}options.busWrite(port,value,offset);},
  gameInterrupt(offset){fillTone(offset);gameIrqPosition=offset;let writes:number[][];
   try{writes=options.gameInterrupt(offset);}finally{gameIrqPosition=undefined;}
   for(const [port,value] of writes){
   samples.writeBusAt(port,value,offset);
  }} });
 return {sampleRate:options.sampleRate,get port61(){return tone.port61;},
  write(writes:number[][]){healthy();if(buffer)throw Error('External Tandy mixed write during render');
   try{for(const [port,value] of writes)samples.writeBus(port,value);}catch(error){failed=true;throw error;}
  },
  writeAt(writes:number[][],offset:number){healthy();
   if(!buffer||gameIrqPosition===undefined||offset!==gameIrqPosition)throw Error('Tandy mixed timed writes require current IRQ position');
   try{for(const [port,value]of writes)samples.writeBusAt(port,value,offset);}catch(error){failed=true;throw error;}
  },
  start(request:Parameters<typeof samples.start>[0]){healthy();if(buffer)throw Error('Tandy sample start requires an explicit bus boundary');try{return samples.start(request);}catch(error){failed=true;throw error;}},
  /** Only the currently executing owning game IRQ may start a sample here. */
  startAt(request:Parameters<typeof samples.start>[0],offset:number){healthy();
   if(!buffer||gameIrqPosition===undefined||offset!==gameIrqPosition)throw Error('Tandy mixed sample start requires the current game IRQ position');
   try{return samples.startAt(request,offset);}catch(error){failed=true;throw error;}
  },
  requestStop(){healthy();try{return samples.requestStop();}catch(error){failed=true;throw error;}},status:(channel:number)=>samples.status(channel),
  render(frames:number){healthy();if(buffer)throw Error('Tandy mixed render is already active');if(!Number.isSafeInteger(frames)||frames<0)throw Error('Invalid Tandy mixed frame count');
   buffer=new Float32Array(frames);position=0;
   try{const dac=samples.render(frames);fillTone(frames);for(let i=0;i<frames;i++)buffer[i]+=dac[i]*options.sampleGain;return buffer;}
   catch(error){failed=true;throw error;}finally{buffer=undefined;}
  },close(){closed=true;samples.close();buffer=undefined;},
 };
}
