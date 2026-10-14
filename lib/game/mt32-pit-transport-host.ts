import type {TimedMt32Host} from './timed-mt32-program.ts';
import {mt32OddMode3Counter} from './mt32-delay-counter.ts';

/** Bounded PIT2 bridge for the original MS91 delay routine. The caller owns
 * elapsed input clocks and polling cost; no CPU speed is inferred here.
 * Counter reads retain both phases and rollover of the odd FFFF reload. */
export function createMt32PitTransportHost(bus:TimedMt32Host,clock:{now():number;poll():Promise<void>;initialPort61:number}) :TimedMt32Host {
 if(!Number.isInteger(clock.initialPort61)||clock.initialPort61<0||clock.initialPort61>255||(clock.initialPort61&1))throw Error('Invalid initial Roland PIT gate state');
 let port61=clock.initialPort61,low:number|undefined,reload=0,start:number|undefined,latch=65535,high=false,lastPoll:number|undefined;
 const now=()=>{const value=clock.now();if(!Number.isSafeInteger(value)||value<0)throw Error('Invalid Roland PIT clock');return value;};
 const portNumber=(port:number)=>{if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid Roland port number');};
 return {
  cancelled:()=>bus.cancelled(),interrupts:enabled=>bus.interrupts(enabled),delay:(loop,iterations)=>bus.delay(loop,iterations),yieldTask:bus.yieldTask?()=>bus.yieldTask!():undefined,
  async write(port,value){
   portNumber(port);if(!Number.isInteger(value)||value<0||value>255)throw Error('Invalid Roland port byte');
   if(port===0x43){
    if(value===0xb6){low=undefined;reload=0;start=undefined;high=false;lastPoll=undefined;}
    else if(value===0x80){
     if(start===undefined||reload!==65535)throw Error('Roland PIT countdown is not initialized');
     await clock.poll();
     const current=now(),elapsed=current-start;
     if(elapsed<0)throw Error('Roland PIT clock moved backwards');
     if(current<=(lastPoll??start))throw Error('Roland PIT polling clock did not advance');
     lastPoll=current;
     latch=elapsed===0?65535:mt32OddMode3Counter(elapsed);high=false;
    }else throw Error('Unsupported Roland PIT command');
   }else if(port===0x42){
    if(low===undefined)low=value&255;else{reload=low|((value&255)<<8);low=undefined;}
   }else if(port===0x61){
    if((value&1)&&!(port61&1)){if(reload!==65535)throw Error('Unsupported Roland PIT reload');start=now();}
    if(!(value&1))start=undefined;port61=value&255;
   }else await bus.write(port,value);
  },
  read(port){
   portNumber(port);
   if(port===0x61)return port61;
   if(port===0x42){const result=high?(latch>>>8):(latch&255);high=!high;return result;}
   return bus.read(port);
  },
 };
}
