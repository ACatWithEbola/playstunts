import {fadeOriginalMusic} from './fade-original-music.ts';
import {createControlledOriginalMt32Music,type TimedMt32MusicHost} from './controlled-mt32-music.ts';
import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
/** Delivery progress, not an audible WebAudio timestamp. */
export interface TimedMt32FadeObserver {command?(value:number,frame?:number):void;volume(value:number,frame?:number):void;stopped():void}
/** Timed fade retains its controller through the original final volume restore.
 * Caller owns tick waiting, stream stop/disposal and transport cancellation. */
export async function fadeTimedMt32Music(music:ReturnType<typeof createControlledOriginalMt32Music>,host:TimedMt32MusicHost,waitTicks:(ticks:number)=>Promise<void>,stopStream:()=>void|Promise<void>,active:()=>boolean,synchronizeDelivery?:()=>Promise<void>,observer?:TimedMt32FadeObserver,commandFrame?:()=>number|undefined){
 const check=()=>{if(!active())throw new DOMException('Roland music fade superseded','AbortError');};
 function* retainedProgram(program:OriginalMt32MpuProgram):OriginalMt32MpuProgram{
  try{
   check();let step=program.next();
   while(!step.done){check();const response=yield step.value;check();step=program.next(response);}
   return step.value;
  }finally{program.return(0);}
 }
 const retainedHost:TimedMt32MusicHost={async execute(program){check();const result=await host.execute(retainedProgram(program));check();return result;},async write(writes){check();await host.write(writes);check();}};
 check();
 const memory=new Uint8Array(65536);memory[0x4e06]=1;let delay=0,stopped=false;
 await fadeOriginalMusic({memory:()=>memory,musicVolume(){throw Error('Unexpected non-Roland fade');},
  async alternateCommand(){await music.effectTimed({type:'master-volume',value:memory[0x4e0b]},retainedHost);check();const frame=commandFrame?.();if(!stopped){observer?.command?.(memory[0x4e0b],frame);check();await synchronizeDelivery?.();check();observer?.volume(memory[0x4e0b],frame);check();}},
  beginDelay(ticks){delay=ticks;},async finishDelay(){check();await waitTicks(delay);check();},
  async stopMusic(){await music.effectTimed({type:'stop-tracks',first:0,last:music.runtime.state.tracks-1},retainedHost);check();await stopStream();check();stopped=true;observer?.stopped();check();},
 },0,2);
}
