import {executeMt32StartupPrograms} from './mt32-startup-programs.ts';
import {executeTimedMt32Program,type TimedMt32Host} from './timed-mt32-program.ts';
import {PC_PIT_INPUT_HZ} from './timer-interrupt.ts';

/** Finish startup on the same synthesis timeline as timed MIDI delivery.
 * The caller supplies actual clock/device ownership and responsiveness;
 * this helper never selects a CPU profile or fabricates MPU responses. */
export async function initializeTimedMt32Device(driver:Uint8Array,patch:Uint8Array,generation:'ms-1990'|'ms-1991',owner:{
 transport:TimedMt32Host;now():number;readonly frame:number;
 output:{sampleRate:number;render(frames:number):Float32Array};
 yieldTask():Promise<void>;
}){
 const check=()=>{if(owner.transport.cancelled())throw new DOMException('Roland startup cancelled','AbortError');};
 check();
 if(!Number.isSafeInteger(owner.output.sampleRate)||owner.output.sampleRate<=0)throw Error('Invalid Roland startup sample rate');
 await executeMt32StartupPrograms(driver,patch,generation,program=>executeTimedMt32Program(program,owner.transport));
 check();
 const clock=owner.now();
 if(!Number.isSafeInteger(clock)||clock<0)throw Error('Invalid Roland startup clock');
 const target=Math.ceil(clock*owner.output.sampleRate/PC_PIT_INPUT_HZ);
 if(!Number.isSafeInteger(target))throw Error('Roland startup timeline overflow');
 let blocks=0;
 for(;;){
  check();const frame=owner.frame;
  if(!Number.isSafeInteger(frame)||frame<0)throw Error('Invalid Roland startup frame');
  if(frame>=target)return;
  const count=Math.min(512,target-frame);
  const samples=owner.output.render(count);
  if(samples.length!==count*2||owner.frame!==frame+count)throw Error('Incomplete Roland startup synthesis');
  if(++blocks===64){blocks=0;await owner.yieldTask();check();}
 }
}
