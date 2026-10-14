import {createPc15SampleClock} from './pc15-sample-clock.ts';
import {startMs91TandySample,requestMs91TandySampleStop} from './ms91-tandy-sample-start.ts';
import {stepMs91TandySampleIrq} from './ms91-tandy-sample-irq.ts';
import {ms91TandySampleStatus} from './ms91-tandy-sample-status.ts';
/** Explicit sample-aligned modern TD15 timer host. Shared PIT0 clock arithmetic
 * is independent of the PC sound driver. CPU/PIC delivery is supplied by caller.
 */
export function createMs91TandySampleHost(memory:()=>Uint8Array,segment:number,options:{sampleRate:number;picMask:number;interruptsEnabled():boolean;write(port:number,value:number,offset:number):void;gameInterrupt(offset:number):void;afterInterrupt?(offset:number):void}){
 const view=()=>{const bytes=memory();if(bytes.length<0x100000||!Number.isInteger(segment)||segment<0||segment>65535||segment*16+3241>bytes.length)throw Error('Invalid Tandy sample host memory');return new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);};
 const base=segment*16,word=(at:number)=>view().getUint16(base+at,true);
 if(!Number.isInteger(options.picMask)||options.picMask<0||options.picMask>255)throw Error('Invalid initial Tandy PIC mask');
 const clock=createPc15SampleClock(options.sampleRate,word(0x58c));
 let picMask=options.picMask,low:number|undefined,armed=false,failed=false,advancing=false;
 const requireHealthy=()=>{if(failed)throw Error('Tandy sample host failed; recreate host');};
 function write(port:number,value:number,offset:number){
  if(port===0x21)picMask=value;
  if(port===0x43&&value===0x36){armed=true;low=undefined;}
  if(port===0x40&&armed){if(low===undefined)low=value;else{clock.reload(low|(value<<8));low=undefined;armed=false;}}
  options.write(port,value,offset);
 }
 return {
  get divisor(){return clock.divisor;},get picMask(){return picMask;},get phase(){return clock.phase;},
  writeBus(port:number,value:number,offset=0){requireHealthy();
   if(!Number.isInteger(port)||port<0||port>65535||!Number.isInteger(value)||value<0||value>255||!Number.isSafeInteger(offset)||offset<0)throw Error('Invalid Tandy bus write');
   try{write(port,value,offset);}catch(error){failed=true;throw error;}
  },
  status(channel:number){return ms91TandySampleStatus(memory().subarray(base,base+3241),channel);},
  start(request:Omit<Parameters<typeof startMs91TandySample>[2],'picMask'>,offset=0){
   requireHealthy();if(!Number.isSafeInteger(offset)||offset<0)throw Error('Invalid Tandy sample start position');
   try{const result=startMs91TandySample(memory(),segment,{...request,picMask});for(const [port,value] of result.writes)write(port,value,offset);return result.started;}catch(error){failed=true;throw error;}
  },
  requestStop(){requireHealthy();return requestMs91TandySampleStop(memory(),segment);},
  advance(frames:number){
   requireHealthy();
   if(advancing)throw Error('Tandy sample clock advance is already active');
   // No fabricated latency or dropped masked IRQ: unsupported delivery is
   // explicit until the owning CPU/PIC host supplies it.
   if(!options.interruptsEnabled()||(picMask&1))throw Error('Tandy sample clock requires an enabled IRQ0 delivery window');
   advancing=true;
   try{clock.advance(frames,offset=>{
    const bytes=memory(),v=view(),ip=v.getUint16(0x20,true),cs=v.getUint16(0x22,true);
    if(cs===segment&&(ip===0xa66||ip===0xae4)){
     const result=stepMs91TandySampleIrq(bytes,segment,ip===0xae4);
     for(const [port,value] of result.writes)write(port,value,offset);
     if(result.returnKind==='chain')options.gameInterrupt(offset);
    }else options.gameInterrupt(offset);
    options.afterInterrupt?.(offset);
   });}catch(error){failed=true;throw error;}finally{advancing=false;}
  },
 };
}
