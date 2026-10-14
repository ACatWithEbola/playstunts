import {PC_PIT_INPUT_HZ} from './timer-interrupt.ts';
/** Virtual channel-zero IRQ clock. Explicit reload mirrors programming PIT0;
 * callback delivery and restored-vector execution belong to the sound host. */
export function createPc15SampleClock(sampleRate:number,initialDivisor:number){
 if(!Number.isSafeInteger(sampleRate)||sampleRate<8000)throw Error('Invalid sample IRQ audio rate');
 let divisor=0,phase=0,delivering=false,advancing=false;
 function reload(value:number){
  if(!Number.isInteger(value)||value<0||value>65535)throw Error('Invalid PIT0 divisor');
  divisor=value||65536;
  // A callback occurs within an output sample. Keep time already elapsed
  // beyond its boundary; an external reload starts a new period now.
  if(!delivering)phase=0;
 }
 reload(initialDivisor);
 return {
  reload,
  get phase(){return phase;},
  get divisor(){return divisor;},
  /** Callbacks may reprogram the timer; use its new period immediately. */
  advance(samples:number,interrupt:(sampleOffset:number)=>void){
   if(!Number.isSafeInteger(samples)||samples<0)throw Error('Invalid sample IRQ block');
   if(advancing)throw Error('Sample IRQ clock advancement overlaps');
   advancing=true;try{
   for(let offset=1;offset<=samples;offset++){
    phase+=PC_PIT_INPUT_HZ;
    while(phase>=divisor*sampleRate){phase-=divisor*sampleRate;delivering=true;try{interrupt(offset);}finally{delivering=false;}}
   }
   }finally{advancing=false;}
  },
  /** Explicit CPU owner may suspend at an IRQ boundary. No wall-clock time
   * is added while waiting, and reload retains the same within-sample phase. */
  async advanceWithWait(samples:number,interrupt:(sampleOffset:number)=>Promise<void>){
   if(!Number.isSafeInteger(samples)||samples<0)throw Error('Invalid sample IRQ block');
   if(advancing)throw Error('Sample IRQ clock advancement overlaps');
   advancing=true;try{
    for(let offset=1;offset<=samples;offset++){
     phase+=PC_PIT_INPUT_HZ;
     while(phase>=divisor*sampleRate){
      phase-=divisor*sampleRate;delivering=true;
      try{await interrupt(offset);}finally{delivering=false;}
     }
    }
   }finally{advancing=false;}
  },
 };
}
