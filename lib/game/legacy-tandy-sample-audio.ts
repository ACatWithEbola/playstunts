import {createOriginalTandyDacTransfer,originalTandyDacGain} from './tandy-dac-transfer.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
/** Legacy BIOS/DMA sample hold. DMA delivery positions and completion dispatch
 * belong to the owning hardware host, not an assumed BIOS execution duration. */
export function createLegacyTandySampleAudio(readByte:(address:number)=>number,supplied:{
 decodeByte(value:number):number;completion(ax:number,frame:number):void;
 initialByte:number;initialVolume:number;
 pauseAt64KiB?:boolean;segmentBoundary?(frame:number):void;
}){
 const options={...supplied};
 if(!Number.isInteger(options.initialByte)||options.initialByte<0||options.initialByte>255)throw Error('Invalid initial Tandy sample byte');
 let decoded=options.decodeByte(options.initialByte),volume=options.initialVolume;
 if(!Number.isFinite(decoded))throw Error('Invalid initial Tandy audio level');
 let level=decoded*originalTandyDacGain(volume);
 const transfer=createOriginalTandyDacTransfer(readByte,{pauseAt64KiB:options.pauseAt64KiB}),events:number[]=[];
 let cursor=0,lastEvent=0,failed=false,closed=false,rendering=false;
 const healthy=()=>{if(failed||closed)throw Error('Legacy Tandy sample audio unavailable');};
 return {get segmentPaused(){return transfer.segmentPaused;},resumeSegment(){healthy();transfer.resumeSegment();},play(request:OriginalTandyBiosSound){healthy();const result=transfer.play(request);if(!result.carry){volume=request.ax&255;level=decoded*originalTandyDacGain(volume);}return result;},
  write(port:number,value:number){
   healthy();if(!Number.isInteger(value)||value<0||value>255)throw Error('Invalid Tandy DAC register byte');
   transfer.write(port,value);
   if(port===0xc7){volume=(value>>>5)&7;level=decoded*originalTandyDacGain(volume);}
  },
  dmaEdge(frame:number){healthy();if(!Number.isSafeInteger(frame)||frame<cursor||frame<lastEvent)throw Error('Invalid Tandy DMA delivery position');events.push(frame);lastEvent=frame;},
  status:()=>transfer.status(),
  render(frames:number){
   healthy();if(rendering)throw Error('Legacy Tandy sample render already active');if(!Number.isSafeInteger(frames)||frames<0||!Number.isSafeInteger(cursor+frames))throw Error('Invalid Tandy sample frame count');
   const result=new Float32Array(frames),end=cursor+frames;let at=0,consumed=0;
   const fill=(target:number)=>{healthy();result.fill(level,at,at+target-cursor);at+=target-cursor;cursor=target;};
   rendering=true;try{
    while(consumed<events.length&&events[consumed]<=end){const frame=events[consumed++];fill(frame);
     const sample=transfer.transferByte();healthy();
     if(sample){decoded=options.decodeByte(sample.value);healthy();if(!Number.isFinite(decoded))throw Error('Invalid Tandy sample conversion');volume=sample.volume;level=decoded*originalTandyDacGain(volume);if(sample.segmentBoundary)options.segmentBoundary?.(frame);healthy();if(sample.completion!==null)options.completion(sample.completion,frame);healthy();}
    }
    fill(end);events.splice(0,consumed);return result;
   }catch(error){failed=true;events.length=0;throw error;}finally{rendering=false;}
  },close(){closed=true;events.length=0;},
 };
}
