import {createOriginalOplChip} from './native-audio.ts';
import {createOplOutput} from './opl-output.ts';
import {createAudioRuntimeStream} from './player-audio-stream.ts';
import {audioBufferBatch} from './audio-buffer-batch.ts';
/** One OPL output and sample clock across driving, replay dialogs and repeated
 * races. The caller swaps the live native runtime without resetting the chip. */
export async function createBrowserRaceAudio(context:AudioContext,initialWrites:number[][],tick:()=>number[][]){
 const chip=await createOriginalOplChip(context),output=createOplOutput(chip),gain=context.createGain();
 gain.gain.value=.6;gain.connect(context.destination);
 const stream=createAudioRuntimeStream({initialWrites,tick},output,context.sampleRate),sources=new Set<AudioBufferSourceNode>();
 let next=0,closed=false;
 const release=(source:AudioBufferSourceNode)=>{source.onended=null;sources.delete(source);try{source.stop();}catch{}source.disconnect();source.buffer=null;};
 return {
  write(writes:number[][]){if(closed)return;for(const [register,value] of writes)output.write(register,value);},
  pump(){
   if(closed||context.state!=='running')return;
   next=audioBufferBatch(next,context.currentTime,512/context.sampleRate,start=>{
    const samples=stream.render(512),buffer=context.createBuffer(2,512,context.sampleRate);
    for(let channel=0;channel<2;channel++){const values=buffer.getChannelData(channel);for(let i=0;i<512;i++)values[i]=samples[i*2+channel]/32768;}
    const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);sources.add(source);source.onended=()=>release(source);source.start(start);
   });
  },
  close(){if(closed)return;closed=true;for(const source of sources)release(source);gain.disconnect();chip.delete();},
 };
}
