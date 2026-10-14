import {createOriginalTandyToneAudio,createOriginalTandyToneStream} from './tandy-tone-audio.ts';
import {audioBufferBatch} from './audio-buffer-batch.ts';
/** Supplied Tandy tone banks across driving, dialogs and race reloads.
 * The surrounding game host must separately service BIOS requests.
 * Audible DAC writes fail in the default tone path. An explicitly supplied
 * backend owns mixed rendering and IRQ dispatch; no second tone IRQ is added.
 * Backend/device lifetime remains with its caller; this adapter owns sources. */
export interface BrowserTandyBackend {
 readonly sampleRate:number;readonly port61:number;
 write(writes:number[][]):void;render(frames:number):Float32Array;
}
export function createBrowserTandyRaceAudio(context:AudioContext,initialWrites:number[][],tick:()=>number[][],backend?:BrowserTandyBackend){
 if(backend&&backend.sampleRate!==context.sampleRate)throw Error('Tandy backend sample rate mismatch');
 const options={variant:'pssj3' as const,clockHz:3579545,psgGain:0.5,speakerGain:1};
 const speaker=createOriginalTandyToneAudio(context.sampleRate,options),gain=context.createGain();
 speaker.write(0x43,0xb6);gain.gain.value=.6;gain.connect(context.destination);
 let stream:Pick<BrowserTandyBackend,'write'|'render'|'port61'>;
 try{if(backend){backend.write(initialWrites);stream=backend;}else stream=createOriginalTandyToneStream({tick:()=>({writes:tick(),bios:[]})},initialWrites,context.sampleRate,options,speaker);}catch(error){gain.disconnect();throw error;}
 const sources=new Set<AudioBufferSourceNode>();
 let next=0,closed=false,suspended=false;
 const release=(source:AudioBufferSourceNode)=>{source.onended=null;sources.delete(source);try{source.stop();}catch{}source.disconnect();source.buffer=null;};
 const close=()=>{if(closed)return;closed=true;for(const source of sources)release(source);gain.disconnect();};
 return {
  get port61(){return stream.port61;},
  suspend(){if(closed)return;suspended=true;for(const source of sources)release(source);next=0;},
  resume(){if(closed)return;suspended=false;next=0;},
  write(writes:number[][]){if(!closed)try{stream.write(writes);}catch(error){close();throw error;}},
  pump(){
   if(closed||suspended||context.state!=='running')return;
   try{next=audioBufferBatch(next,context.currentTime,512/context.sampleRate,start=>{
    const samples=stream.render(512);if(samples.length!==512||!samples.every(Number.isFinite))throw Error('Invalid Tandy backend audio buffer');
    const buffer=context.createBuffer(1,512,context.sampleRate);buffer.copyToChannel(new Float32Array(samples),0);
    const source=context.createBufferSource();source.buffer=buffer;sources.add(source);source.onended=()=>release(source);source.connect(gain);source.start(start);
   });}catch(error){close();throw error;}
  },
  close,
 };
}
