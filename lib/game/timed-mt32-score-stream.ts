import {createControlledOriginalMt32Music} from './controlled-mt32-music.ts';
import {createTimedMt32AudioStream,type Mt32StereoOutput} from './mt32-audio-stream.ts';
import {createMt32MusicWriteProgram} from './mt32-music-write-program.ts';
import {executeTimedMt32Program,type TimedMt32Host} from './timed-mt32-program.ts';
import type {OriginalMt32MusicSeed} from './mt32-music-runtime.ts';
import {fadeTimedMt32Music,type TimedMt32FadeObserver} from './timed-mt32-music-fade.ts';
/** One timed score on an already initialized device. The caller supplies the
 * original execution profile and owns device lifetime; no ready/PIT defaults. */
export async function createTimedMt32ScoreStream(seed:OriginalMt32MusicSeed,output:Mt32StereoOutput,transport:TimedMt32Host,onHardwareTick?:(dispatch:boolean)=>void){
 const music=createControlledOriginalMt32Music(seed);let closed=false,fadeOwner=0;
 const host:TimedMt32Host={read:port=>transport.read(port),write:(port,value)=>transport.write(port,value),interrupts:enabled=>transport.interrupts(enabled),delay:(loop,iterations)=>transport.delay(loop,iterations),cancelled:()=>closed||transport.cancelled(),...(transport.yieldTask?{yieldTask:()=>transport.yieldTask!()}: {})};
 const check=()=>{if(host.cancelled())throw new DOMException('Roland score cancelled','AbortError');};
 const deliver=async(writes:number[][])=>{
  check();
  const result=await executeTimedMt32Program(createMt32MusicWriteProgram(music.runtime.driver,writes,seed.driverGeneration??'ms-1990'),host);
  if(result!==0)throw Error('Roland score transport failed');
 };
 await deliver(seed.initialWrites);
 const controllerHost={write:deliver,execute:(program:Parameters<typeof executeTimedMt32Program>[0])=>executeTimedMt32Program(program,host)};
 const guardedOutput:Mt32StereoOutput={sampleRate:output.sampleRate,
  ...(output.irqReady?{irqReady:()=>{check();return output.irqReady!();}}:{}),
  write(writes){check();output.write(writes);},render(frames){check();return output.render(frames);}};
 const stream=createTimedMt32AudioStream(guardedOutput,async()=>{check();await music.tickTimed(controllerHost);return [];},onHardwareTick);
 return {sampleRate:output.sampleRate,
  get renderedFrame(){return output.renderedFrame;},
  render(frames:number){check();return stream.render(frames);},
  control:(operation:Parameters<typeof music.controlTimed>[0])=>music.controlTimed(operation,controllerHost),
  get settings(){return music.state;},
  get deliveryReady(){check();return !output.irqReady||output.irqReady();},
  fadeOut(waitTicks:(ticks:number)=>Promise<void>,stopAudio:()=>void|Promise<void>,pumpDelivery?:()=>Promise<void>,observer?:TimedMt32FadeObserver){
   check();const owner=++fadeOwner;
   const active=()=>!closed&&owner===fadeOwner&&!transport.cancelled();
   return fadeTimedMt32Music(music,controllerHost,waitTicks,stopAudio,active,pumpDelivery?async()=>{
    // A CPU-side control may have returned ahead of rendered hardware time.
    // Start its original two-tick delay only after delivery reaches that return
    // point. Keep callback guards and all PCM; never render/discard catch-up.
    while(output.irqReady&&!output.irqReady()){
     if(!active())throw new DOMException('Roland music fade superseded','AbortError');
     await pumpDelivery();
     if(!active())throw new DOMException('Roland music fade superseded','AbortError');
     if(output.irqReady&&!output.irqReady())await (host.yieldTask?.()??new Promise(resolve=>setTimeout(resolve,0)));
    }
   }:undefined,observer,()=>output.lastWriteFrame);
  },
  close(){closed=true;fadeOwner++;},
 };
}
