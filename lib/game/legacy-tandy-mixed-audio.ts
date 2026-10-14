import {createOriginalTandyToneAudio,type OriginalTandyToneOutputOptions} from './tandy-tone-audio.ts';
import {createLegacyTandySampleAudio} from './legacy-tandy-sample-audio.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
type BiosResult={ax:number;carry:boolean};
type Bus={write(writes:number[][]):void;play(request:OriginalTandyBiosSound):BiosResult;status():BiosResult;deliverCompletionInterrupt():void;resumeDmaSegment():void;grantDma():void};
type Event={frame:number;kind:'dma'}|{frame:number;kind:'completion'}|{frame:number;kind:'game'}|{frame:number;kind:'write';writes:number[][]}|{frame:number;kind:'bios';request:OriginalTandyBiosSound};
/** Legacy tone/DMA compositor with explicitly supplied bus/IRQ boundaries.
 * Does not invent BIOS execution time, DMA arbitration, event priority, clock
 * reset contents or analog filtering. No autonomous second game timer runs.
 * A CPU/DMA owner must schedule events and deliver BIOS completion callbacks. */
export function createLegacyTandyMixedAudio(readByte:(address:number)=>number,supplied:{
 sampleRate:number;tone:OriginalTandyToneOutputOptions;sampleGain:number;
 decodeByte(value:number):number;initialByte:number;initialVolume:number;
 completion(ax:number,frame:number,bus:Bus):void;
 /** Explicit host-owned interrupt delivery; omitted retains synchronous fixtures. */
 deferCompletionInterrupts?:boolean;
 pauseAt64KiB?:boolean;segmentBoundary?(frame:number,bus:Bus):void;
 gameInterrupt(frame:number,bus:Bus):void;
 biosResult?(result:BiosResult,frame:number):void;
 busWrite?(port:number,value:number,frame:number):void;
}){
 const options={...supplied,tone:{...supplied.tone}};
 if(!Number.isSafeInteger(options.sampleRate)||options.sampleRate<=0||!Number.isFinite(options.sampleGain)||options.sampleGain<0)throw Error('Invalid legacy Tandy mix profile');
 const tone=createOriginalTandyToneAudio(options.sampleRate,{...options.tone});tone.write(0x43,0xb6);
 const events:Event[]=[];let cursor=0,lastEvent=0,closed=false,failed=false,rendering=false,boundary:number|undefined;
 const pendingCompletions:number[]=[];
 let deliveringCompletion=false;
 const healthy=()=>{if(closed||failed)throw Error('Legacy Tandy mixed audio unavailable');};
 const writesSnapshot=(writes:number[][])=>writes.map(pair=>{
  if(pair.length!==2||![0xc0,0xc1,0x40,0x42,0x43,0x61,0xc6,0xc7].includes(pair[0])||!Number.isInteger(pair[1])||pair[1]<0||pair[1]>255)throw Error('Invalid legacy Tandy bus write');
  return pair.slice();
 });
 const biosSnapshot=(request:OriginalTandyBiosSound)=>{
  const copy={...request};
  for(const key of ['ax','es','bx','cx','dx'] as const){const value=copy[key];if(!Number.isInteger(value)||value<0||value>65535)throw Error('Invalid legacy Tandy BIOS word');}
  if(copy.ax>>>8!==0x83||(copy.ax&255)>7||copy.cx<1||copy.dx<1||copy.dx>4095)throw Error('Unresolved legacy Tandy BIOS request');
  return copy;
 };
 const samples=createLegacyTandySampleAudio(readByte,{decodeByte:options.decodeByte,initialByte:options.initialByte,initialVolume:options.initialVolume,
  pauseAt64KiB:options.pauseAt64KiB,segmentBoundary(frame){options.segmentBoundary?.(frame,bus);},
  completion(ax,frame){if(options.deferCompletionInterrupts)pendingCompletions.push(ax);else options.completion(ax,frame,bus);},
 });
 const deliverWrites=(writes:number[][],frame:number)=>{
  for(const [port,value] of writes){healthy();if(port===0xc6||port===0xc7)samples.write(port,value);else tone.write(port,value);options.busWrite?.(port,value,frame);healthy();}
 };
 const deliverBios=(request:OriginalTandyBiosSound,frame:number)=>{healthy();const result=samples.play(request);options.biosResult?.({...result},frame);healthy();return result;};
 const deliverCompletion=()=>{
  healthy();if(boundary===undefined)throw Error('Legacy Tandy completion has no owning boundary');
  if(!options.deferCompletionInterrupts)throw Error('Explicit legacy completion delivery requires deferred profile');
  if(deliveringCompletion)throw Error('Legacy Tandy completion delivery already active');
  const ax=pendingCompletions.shift();if(ax===undefined)throw Error('No pending legacy completion interrupt');
  deliveringCompletion=true;try{options.completion(ax,boundary,bus);healthy();}finally{deliveringCompletion=false;}
 };
 const bus:Bus={write(writes){healthy();if(boundary===undefined)throw Error('Legacy Tandy callback bus has no owning boundary');deliverWrites(writesSnapshot(writes),boundary);},
  play(request){healthy();if(boundary===undefined)throw Error('Legacy Tandy callback BIOS has no owning boundary');return deliverBios(biosSnapshot(request),boundary);},
  status(){healthy();if(boundary===undefined)throw Error('Legacy Tandy callback status has no owning boundary');return samples.status();},
  // Owner chooses the enabled BIOS/CPU interrupt window; no automatic priority.
  deliverCompletionInterrupt:deliverCompletion,
  resumeDmaSegment(){healthy();if(boundary===undefined)throw Error('Legacy Tandy DMA restart has no owning boundary');samples.resumeSegment();},
  /** A hardware owner may grant a clock request inside its current boundary.
   * This grants one byte, not an automatic clock or interrupt priority. */
  grantDma(){healthy();if(boundary===undefined)throw Error('Legacy Tandy DMA grant has no owning boundary');samples.dmaEdge(boundary);samples.render(0);healthy();},
 };
 const schedule=(event:Event)=>{healthy();if(rendering)throw Error('External legacy Tandy scheduling during render');if(!Number.isSafeInteger(event.frame)||event.frame<cursor||event.frame<lastEvent)throw Error('Invalid legacy Tandy event position');events.push(event);lastEvent=event.frame;};
 return {sampleRate:options.sampleRate,get port61(){return tone.port61;},status(){healthy();return samples.status();},
  get pendingCompletionInterrupts(){return pendingCompletions.length;},
  scheduleCompletionInterrupt(frame:number){if(!options.deferCompletionInterrupts)throw Error('Explicit legacy completion delivery requires deferred profile');schedule({frame,kind:'completion'});},
  scheduleDma(frame:number){schedule({frame,kind:'dma'});},scheduleGameInterrupt(frame:number){schedule({frame,kind:'game'});},
  scheduleWrites(frame:number,writes:number[][]){schedule({frame,kind:'write',writes:writesSnapshot(writes)});},
  scheduleBios(frame:number,request:OriginalTandyBiosSound){schedule({frame,kind:'bios',request:biosSnapshot(request)});},
  write(writes:number[][]){healthy();if(rendering)throw Error('External legacy Tandy write during render');try{deliverWrites(writesSnapshot(writes),cursor);}catch(error){failed=true;throw error;}},
  render(frames:number){
   healthy();if(rendering||!Number.isSafeInteger(frames)||frames<0||!Number.isSafeInteger(cursor+frames))throw Error('Invalid legacy Tandy render');
   const result=new Float32Array(frames),end=cursor+frames;let at=0,consumed=0;
   const fill=(target:number)=>{healthy();const count=target-cursor,tones=tone.render(count),dac=samples.render(count);healthy();for(let i=0;i<count;i++)result[at+i]=tones[i]+dac[i]*options.sampleGain;at+=count;cursor=target;};
   rendering=true;
   try{
    while(consumed<events.length&&events[consumed].frame<=end){const event=events[consumed++];fill(event.frame);boundary=cursor;
     try{
      if(event.kind==='dma'){samples.dmaEdge(cursor);samples.render(0);}
      else if(event.kind==='completion')deliverCompletion();
      else if(event.kind==='game')options.gameInterrupt(cursor,bus);
      else if(event.kind==='write')deliverWrites(event.writes,cursor);
      else deliverBios(event.request,cursor);
      healthy();
     }finally{boundary=undefined;}
    }
    fill(end);events.splice(0,consumed);return result;
   }catch(error){failed=true;events.length=0;pendingCompletions.length=0;throw error;}finally{rendering=false;boundary=undefined;}
  },close(){closed=true;events.length=0;pendingCompletions.length=0;samples.close();},
 };
}
