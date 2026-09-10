import {createOriginalPcSpeakerPit} from './pc-speaker-pit.ts';
import {PC_PIT_INPUT_HZ} from './timer-interrupt.ts';
import {audioTimerSampleOffsets} from './audio-sample-clock.ts';
/** Integrates the digital speaker output across each audio sample. A20Hz DC
 * blocker approximates AC coupling; this is not a measured speaker response. */
export function createOriginalPcSpeakerAudio(sampleRate:number){
 if(!Number.isSafeInteger(sampleRate)||sampleRate<8000)throw Error('Invalid PC speaker sample rate');
 const pit=createOriginalPcSpeakerPit(),coefficient=Math.exp(-2*Math.PI*20/sampleRate);let untilClock=sampleRate,lastInput=0,lastOutput=0,port61=0;
 return {
  get port61(){return port61;},
  write(port:number,value:number){if(port===0x61)port61=value&255;pit.write(port,value);},
  render(samples:number){
   if(!Number.isSafeInteger(samples)||samples<0)throw Error('Invalid PC speaker buffer length');const result=new Float32Array(samples);
   for(let i=0;i<samples;i++){
    let remaining=PC_PIT_INPUT_HZ,area=0;
    while(remaining>=untilClock){if(pit.output)area+=untilClock;remaining-=untilClock;pit.clock();untilClock=sampleRate;}
    if(pit.output)area+=remaining;untilClock-=remaining;const input=area/PC_PIT_INPUT_HZ;lastOutput=coefficient*(lastOutput+input-lastInput);lastInput=input;result[i]=lastOutput*0.35;
   }
   return result;
  }
 };
}
/** Tone stream. Sample IRQ scheduling must be joined before using this
 * for effects that select slot0. It retains the original100Hz PIT divisor. */
export function createOriginalPcSpeakerToneStream(runtime:{tick():number[][]},initialWrites:number[][],sampleRate:number,existingSpeaker?:ReturnType<typeof createOriginalPcSpeakerAudio>){
 const speaker=existingSpeaker??createOriginalPcSpeakerAudio(sampleRate);let phase=0;
 const write=(writes:number[][])=>{for(const [port,value] of writes)speaker.write(port,value);};if(!existingSpeaker)write([[0x43,0xb6]]);write(initialWrites);
 return {write,render(samples:number){
  const clock=audioTimerSampleOffsets(phase,samples,sampleRate),result=new Float32Array(samples);let position=0;
  for(const boundary of clock.offsets){result.set(speaker.render(boundary-position),position);position=boundary;write(runtime.tick());}
  result.set(speaker.render(samples-position),position);phase=clock.phase;return result;
 }};
}

/** Backward-compatible score entry; music and driving use the same tone clock. */
export const createOriginalPcSpeakerMusicStream=createOriginalPcSpeakerToneStream;
