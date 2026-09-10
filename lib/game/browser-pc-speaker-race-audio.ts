import {createOriginalPcSpeakerAudio,createOriginalPcSpeakerToneStream} from './pc-speaker-audio.ts';
import {audioBufferBatch} from './audio-buffer-batch.ts';
/** One native speaker and timer phase across driving, dialogs and race reloads.
 * Sample-channel IRQ scheduling must be supplied before selecting sample patches. */
export function createBrowserPcSpeakerRaceAudio(context:AudioContext,initialWrites:number[][],tick:()=>number[][]){
 const speaker=createOriginalPcSpeakerAudio(context.sampleRate),gain=context.createGain();
 speaker.write(0x43,0xb6);gain.gain.value=.6;gain.connect(context.destination);
 const stream=createOriginalPcSpeakerToneStream({tick},initialWrites,context.sampleRate,speaker),sources=new Set<AudioBufferSourceNode>();
 let next=0,closed=false;
 const release=(source:AudioBufferSourceNode)=>{source.onended=null;sources.delete(source);try{source.stop();}catch{}source.disconnect();source.buffer=null;};
 return {
  get port61(){return speaker.port61;},
  write(writes:number[][]){if(!closed)stream.write(writes);},
  pump(){
   if(closed||context.state!=='running')return;
   next=audioBufferBatch(next,context.currentTime,512/context.sampleRate,start=>{
    const buffer=context.createBuffer(1,512,context.sampleRate);buffer.copyToChannel(stream.render(512),0);
    const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);sources.add(source);source.onended=()=>release(source);source.start(start);
   });
  },
  close(){if(closed)return;closed=true;for(const source of sources)release(source);gain.disconnect();},
 };
}
