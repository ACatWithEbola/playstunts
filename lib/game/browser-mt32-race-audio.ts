import {createMt32AudioStream,type Mt32StereoOutput} from './mt32-audio-stream.ts';
import {audioBufferBatch} from './audio-buffer-batch.ts';
/** Keeps one synthesizer and IRQ phase through driving, replay and dialogs.
 * The caller owns initialization, original SysEx pacing and synthesizer disposal. */
export function createBrowserMt32RaceAudio(context:AudioContext,output:Mt32StereoOutput,initialWrites:number[][],tick:()=>number[][]){
 const stream=createMt32AudioStream(output,tick),sources=new Set<AudioBufferSourceNode>();
 const gain=context.createGain();gain.gain.value=1;gain.connect(context.destination);
 let next=0,closed=false,suspended=false,suspendedSample=0;
 let suspendedClock:(()=>void)|undefined;
 const advanceSuspendedClock=()=>{
  if(!suspendedClock||context.state!=='running')return;
  const sample=Math.floor(context.currentTime*output.sampleRate),frames=sample-suspendedSample;suspendedSample=sample;
  stream.advanceClock(frames,suspendedClock);
 };
 const release=(source:AudioBufferSourceNode)=>{source.onended=null;sources.delete(source);try{source.stop();}catch{}source.disconnect();source.buffer=null;};
 const unsubscribe=output.onDeviceChange?.(()=>{for(const source of sources)release(source);});
 try{stream.write(initialWrites);}catch(error){unsubscribe?.();gain.disconnect();throw error;}
 return {
  setVolume(value:number,at=context.currentTime,fade=0){if(!Number.isFinite(value)||value<0||value>1||!Number.isFinite(at)||!Number.isFinite(fade)||fade<0)throw Error('Invalid playback volume');if(!closed){const parameter=gain.gain;parameter.cancelAndHoldAtTime(at);if(fade>0)parameter.linearRampToValueAtTime(value,at+fade);else parameter.setValueAtTime(value,at);}},
  prepare(writes:number[][]){if(!closed){if(output.prepare)output.prepare(writes);else stream.write(writes);}},
  write(writes:number[][]){if(!closed)stream.write(writes);},
  // Results music temporarily owns the shared device. Retain this stream's
  // IRQ phase, but release its queued browser sound and stop rendering it.
  // The completed race may still advance its global timer without synthesis.
  suspend(clock?:()=>void){if(closed||suspended)return;suspended=true;suspendedClock=clock;suspendedSample=Math.floor(context.currentTime*output.sampleRate);for(const source of sources)release(source);next=0;},
  resume(){if(closed||!suspended)return;advanceSuspendedClock();suspended=false;suspendedClock=undefined;},
  pump(){
   if(closed||context.state!=='running')return;
   if(suspended){advanceSuspendedClock();return;}
   next=audioBufferBatch(next,context.currentTime,512/output.sampleRate,start=>{
    const samples=stream.render(512),buffer=context.createBuffer(2,512,output.sampleRate);
    for(let channel=0;channel<2;channel++){const values=buffer.getChannelData(channel);for(let i=0;i<512;i++)values[i]=samples[i*2+channel];}
    const source=context.createBufferSource();source.buffer=buffer;source.connect(gain);sources.add(source);source.onended=()=>release(source);source.start(start);
   });
  },
  close(){if(closed)return;closed=true;suspendedClock=undefined;unsubscribe?.();for(const source of sources)release(source);gain.disconnect();},
 };
}
