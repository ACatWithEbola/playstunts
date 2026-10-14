import {createOriginalPcSpeakerAudio} from './pc-speaker-audio.ts';
import {createPc15SampleClock} from './pc15-sample-clock.ts';
import {ORIGINAL_PIT_DIVISOR} from './timer-interrupt.ts';
/** Speaker stream with explicit IRQ0 delivery. The host selects the current
 * vector and supplies sample/ordinary callback writes, never DOS execution. */
export function createPc15InterruptAudioStream(runtime:{interrupt():number[][]},initialWrites:number[][],sampleRate:number,existingSpeaker?:ReturnType<typeof createOriginalPcSpeakerAudio>){
 const speaker=existingSpeaker??createOriginalPcSpeakerAudio(sampleRate),clock=createPc15SampleClock(sampleRate,ORIGINAL_PIT_DIVISOR);
 let timerSelected=false,low:number|undefined;
 const write=(writes:number[][])=>{
  for(const [port,raw] of writes){
   const value=raw&255;
   if(port===0x43&&(value>>6)===0){
    if(value!==0x36)throw Error('Unsupported PC15 PIT0 programming command');
    timerSelected=true;low=undefined;
   }else if(port===0x40){
    if(!timerSelected)throw Error('PC15 PIT0 count written without a selected mode');
    if(low===undefined)low=value;
    else{clock.reload(low|(value<<8));low=undefined;}
   }
   speaker.write(port,value);
  }
 };
 if(!existingSpeaker)write([[0x43,0xb6]]);write(initialWrites);
 return {write,get divisor(){return clock.divisor;},render(samples:number){
  if(!Number.isSafeInteger(samples)||samples<0)throw Error('Invalid PC15 interrupt audio block');
  const result=new Float32Array(samples);let position=0;
  clock.advance(samples,boundary=>{
   result.set(speaker.render(boundary-position),position);position=boundary;write(runtime.interrupt());
  });
  result.set(speaker.render(samples-position),position);return result;
 }};
}
