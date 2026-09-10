import {createOriginalTandyToneAudio,createOriginalTandyToneStream} from './tandy-tone-audio.ts';
import {audioBufferBatch} from './audio-buffer-batch.ts';
/** Supplied Tandy tone banks across driving, dialogs and race reloads.
 * The surrounding game host must separately service BIOS requests.
 * Audible DAC writes still fail rather than being discarded. */
export function createBrowserTandyRaceAudio(context:AudioContext,initialWrites:number[][],tick:()=>number[][]){
 const options={variant:'pssj3' as const,clockHz:3579545,psgGain:0.5,speakerGain:1};
 const speaker=createOriginalTandyToneAudio(context.sampleRate,options),gain=context.createGain();
 speaker.write(0x43,0xb6);gain.gain.value=.6;gain.connect(context.destination);
 const stream=createOriginalTandyToneStream({tick:()=>({writes:tick(),bios:[]})},initialWrites,context.sampleRate,options,speaker),sources=new Set<AudioBufferSourceNode>();
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
