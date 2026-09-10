import {originalRaceNeedsOpponentWait,originalOpponentWaitContinues} from './race-completion-flow.ts';
import {originalGameTime} from './game-time-format.ts';

export interface NativeOpponentWaitHost {
 memory():Uint8Array;
 show(resource:string,mode:number,x:number,y:number,border:number):Promise<void>;
 captureInput(mode:number):void;
 simulate(incomingSI:number):void;
 drawTime(text:string):void;
 key(mode:number):Promise<number>;
}
/** Original14083..14160. The first simulated frame redraws the timer,
 * followed by every twentieth frame. Even a clock already at30000 runs
 * one iteration; the original tests for equality after simulation/input. */
export async function waitForNativeOpponent(host:NativeOpponentWaitHost,d:number){
 let memory=host.memory();
 if(originalRaceNeedsOpponentWait(memory[d+0xa3c2],memory[d+0x8fc8],memory[d+0x8da1])){
  const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
  await host.show('ecop',3,-1,80,view.getUint16(d+0x4ec0,true));
  host.memory()[d+0xa34e]=1;
  let phase=19;
  for(;;){
   host.captureInput(1);host.simulate(phase);memory=host.memory();
   const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
   if(++phase===20){phase=0;host.drawTime(originalGameTime((view.getUint16(d+0x8c26,true)+view.getUint16(d+0xa034,true))&65535,true));}
   const key=await host.key(1);memory=host.memory();
   const current=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
   if(!originalOpponentWaitContinues(key,memory[d+0x8da1],current.getUint16(d+0x8c26,true),current.getUint16(d+0xa034,true)))break;
  }
 }
 host.memory()[d+0xa34e]=0;
}
