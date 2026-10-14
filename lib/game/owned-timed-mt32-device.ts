import {createMt32ExecutionClock} from './mt32-execution-clock.ts';
import {createMt32UartHandshake} from './mt32-uart-handshake.ts';
import {createSampleTimedMt32Device} from './sample-timed-mt32-device.ts';
import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
import type {TimedMt32Host} from './timed-mt32-program.ts';

/** Explicit nominal CPU/MPU profile on one synthesis timeline. Device lifetime
 * remains with the caller. No machine speed, IRQ policy or readiness defaults. */
export function createOwnedTimedMt32Device(device:Mt32StereoOutput,profile:{
 cpuHz:number;pollCycles:number;resetClocks:number;initialPort61:number;
 interrupts(enabled:boolean):void|Promise<void>;cancelled():boolean;yieldTask():Promise<void>;
}){
 const clock=createMt32ExecutionClock(profile),mpu=createMt32UartHandshake(clock.now,profile.resetClocks);
 const bridge=createSampleTimedMt32Device(device,{...clock,initialPort61:profile.initialPort61,
  async read(port){
   if(port!==0x330&&port!==0x331)throw Error('Unsupported owning MPU read');
   await clock.poll();return mpu.read(port);
  },
  write(port,value){if(port!==0x331)throw Error('Unsupported owning MPU write');mpu.writeCommand(value);},
  interrupts:enabled=>profile.interrupts(enabled),cancelled:()=>profile.cancelled(),yieldTask:()=>profile.yieldTask(),
 });
 const transport:TimedMt32Host={
  read:port=>bridge.transport.read(port),
  write(port,value){
   if(port===0x330&&!mpu.uart)throw Error('Roland MIDI write before UART startup');
   return bridge.transport.write(port,value);
  },
  interrupts:enabled=>bridge.transport.interrupts(enabled),delay:(loop,count)=>bridge.transport.delay(loop,count),
  cancelled:()=>bridge.transport.cancelled(),yieldTask:()=>profile.yieldTask(),
 };
 return {transport,output:bridge.output,now:clock.now,get frame(){return bridge.frame;},
  yieldTask:()=>profile.yieldTask(),close:()=>bridge.close(),
 };
}
