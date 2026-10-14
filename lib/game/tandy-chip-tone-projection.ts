import {createOriginalTandyPsg} from './tandy-psg.ts';
import {createOriginalPcSpeakerPit} from './pc-speaker-pit.ts';
import {PC_PIT_INPUT_HZ} from './timer-interrupt.ts';
import type {OriginalTandyToneOutputOptions} from './tandy-tone-audio.ts';
/** Integrate PSG and supplementary PIT output around fine chip-time writes.
 * Clock progress must already be covered by the external hardware owner.
 * Same-tick writes preserve caller order; chip edges precede writes at ties.
 * Existing20Hz coupling approximation and explicit gains are retained. */
export function createTandyChipToneProjection(sampleRate:number,supplied:OriginalTandyToneOutputOptions){
 const options={...supplied};
 if(!Number.isSafeInteger(sampleRate)||sampleRate<8000||!Number.isSafeInteger(options.clockHz)||options.clockHz<1||![options.psgGain,options.speakerGain].every(value=>Number.isFinite(value)&&value>=0))throw Error('Invalid fine Tandy tone profile');
 const psg=createOriginalTandyPsg(options.variant),pit=createOriginalPcSpeakerPit(),coefficient=Math.exp(-2*Math.PI*20/sampleRate);
 const events:Array<{tick:number;port:number;value:number}>=[];
 let cursor=0,position=0,lastEvent=0,untilPit=options.clockHz/PC_PIT_INPUT_HZ,port61=0,closed=false;
 let previousPsg=0,filteredPsg=0,previousSpeaker=0,filteredSpeaker=0;
 const healthy=()=>{if(closed)throw Error('Fine Tandy tone projection closed');};
 const at=(frame:number)=>{const product=frame*options.clockHz;if(!Number.isSafeInteger(product))throw Error('Fine tone timeline overflow');return product/sampleRate;};
 const advance=(clocks:number)=>{
  const psgArea=psg.advanceClocks(clocks);let left=clocks,speakerArea=0;
  while(left>=untilPit){if(pit.output)speakerArea+=untilPit;left-=untilPit;pit.clock();untilPit=options.clockHz/PC_PIT_INPUT_HZ;}
  if(pit.output)speakerArea+=left;untilPit-=left;return [psgArea,speakerArea];
 };
 return {
  get port61(){return port61;},
  write(tick:number,port:number,value:number){healthy();if(!Number.isSafeInteger(tick)||tick<position||tick<lastEvent||![0xc0,0xc1,0x40,0x42,0x43,0x61].includes(port)||!Number.isInteger(value)||value<0||value>255)throw Error('Invalid fine Tandy tone write');events.push({tick,port,value});lastEvent=tick;},
  render(frames:number,coveredTick:number){
   healthy();if(!Number.isSafeInteger(frames)||frames<0||!Number.isSafeInteger(cursor+frames)||!Number.isSafeInteger(coveredTick)||coveredTick<Math.ceil(at(cursor+frames)))throw Error('Fine tone hardware coverage missing');
   const pcm=new Float32Array(frames);let consumed=0;
   for(let index=0;index<frames;index++){
    const end=at(cursor+index+1),span=end-position;let psgArea=0,speakerArea=0;
    while(consumed<events.length&&events[consumed].tick<=end){const event=events[consumed++],area=advance(event.tick-position);psgArea+=area[0];speakerArea+=area[1];position=event.tick;
     if(event.port===0xc0||event.port===0xc1)psg.write(event.value);else{pit.write(event.port,event.value);if(event.port===0x61)port61=event.value;}
    }
    const area=advance(end-position);psgArea+=area[0];speakerArea+=area[1];position=end;
    const psgInput=psgArea/span,speakerInput=speakerArea/span;
    filteredPsg=coefficient*(filteredPsg+psgInput-previousPsg);previousPsg=psgInput;
    filteredSpeaker=coefficient*(filteredSpeaker+speakerInput-previousSpeaker);previousSpeaker=speakerInput;
    pcm[index]=filteredPsg*options.psgGain+filteredSpeaker*0.35*options.speakerGain;
   }
   events.splice(0,consumed);cursor+=frames;return pcm;
  },
  snapshot:()=>({cursor,position,untilPit,port61,previousPsg,filteredPsg,previousSpeaker,filteredSpeaker,psg:psg.snapshot(),pending:events.length}),
  close(){closed=true;events.length=0;},
 };
}
