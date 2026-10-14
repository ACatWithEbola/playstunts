import {createLegacyTandyVirtualRaceBinding} from './legacy-tandy-virtual-race-binding.ts';
import {audioTimerSampleOffsets} from './audio-sample-clock.ts';
import {completeOriginalTandySample} from './tandy-sample.ts';
import {stopOriginalTandyChannel} from './tandy-lifecycle.ts';
import {advanceOriginalNestedHardwareClock} from './hardware-clock-memory.ts';
type Binding=ReturnType<typeof createLegacyTandyVirtualRaceBinding>;
type Program=Parameters<Binding['start']>[0];
/** Opt-in browser backend. One original PIT host dispatches deferred legacy
 * race programs; DAC requests do not dispatch another game timer.
 * Resource-stop/replacement integration must be verified before selection. */
export function createBrowserLegacyTandyVirtualBackend(sampleRate:number,segment=0x39e1){
 if(!Number.isInteger(segment)||segment<0||segment>0xffff)throw Error('Invalid legacy Tandy driver segment');
 let binding:Binding|undefined,phase=0,program:(()=>Program)|undefined,memory:(()=>Uint8Array)|undefined,closed=false,rendering=false,quiescing=false,stopping=false;
 const lifetime=new AbortController();
 const current=()=>{if(closed||!binding)throw Error('Legacy virtual browser backend unavailable');return binding;};
 const close=()=>{if(closed)return;closed=true;lifetime.abort();binding?.close();binding=undefined;program=undefined;memory=undefined;};
 return {
  profile:'legacy-tandy-virtual' as const,sampleRate,
  get port61(){return binding?.port61??0;},
  attach(nextMemory:()=>Uint8Array,nextProgram:()=>Program){
   if(closed||rendering||stopping||binding?.waiting||binding?.status().carry)throw Error('Legacy virtual attachment requires idle owner');
   const next=createLegacyTandyVirtualRaceBinding(address=>nextMemory()[address],{sampleRate,clockHz:3579545,divisor:1,volume:0,initialByte:128,decodeByte:byte=>(byte-128)/128,sampleGain:0.5,
    tone:{variant:'pssj3',clockHz:3579545,psgGain:0.5,speakerGain:1},toneWrites(){},
    completion(ax,_tick,bus){const live=nextMemory(),offset=segment*16;if(offset+2993>live.length)throw Error('Legacy Tandy driver outside attached memory');const result=completeOriginalTandySample(live.subarray(offset,offset+2993),ax);if(result.chain)throw Error('Unexpected legacy completion chain');for(const request of result.bios)bus.play(request);},
   });
   binding?.close();binding=next;program=nextProgram;memory=nextMemory;phase=0;quiescing=false;
  },
  write(writes:number[][]){current().write(writes);},
  status(){return current().status();},
  async stopForResourceRelease(wait:()=>Promise<void>,signal?:AbortSignal){
   const active=current();if(rendering||stopping||active.waiting)throw Error('Legacy virtual stop overlaps sound work');
   if(signal?.aborted)return false;
   const live=memory!(),offset=segment*16;if(offset+2993>live.length)throw Error('Legacy Tandy driver outside attached memory');
   stopping=true;quiescing=true;
   try{
    const stopped=stopOriginalTandyChannel(live.subarray(offset,offset+2993),segment,0,active.port61);
    active.start((function*(){yield {writes:stopped.writes,sampleStarts:[],bios:stopped.bios};return {writes:[],bios:[]};})());
    for(;;){
     if(closed||signal?.aborted)return false;if(!active.status().carry)break;
     const cancellation=signal?AbortSignal.any([signal,lifetime.signal]):lifetime.signal;
     let abort:()=>void=()=>{};
     try{
      const cancelled=new Promise<boolean>(resolve=>{abort=()=>resolve(false);cancellation.addEventListener('abort',abort,{once:true});if(cancellation.aborted)abort();});
      const continued=await Promise.race([Promise.resolve().then(wait).then(()=>true),cancelled]);
      if(!continued)return false;
     }finally{cancellation.removeEventListener('abort',abort);}
    }
    quiescing=false;return true;
   }catch(error){close();throw error;}finally{stopping=false;}
  },
  render(frames:number){
   const active=current();if(rendering)throw Error('Legacy virtual browser render reentry');
   const clock=audioTimerSampleOffsets(phase,frames,sampleRate);rendering=true;
   try{const output=new Float32Array(frames);let position=0;
    for(const boundary of clock.offsets){output.set(active.render(boundary-position),position);position=boundary;if(!quiescing)active.start(program!());else advanceOriginalNestedHardwareClock(memory!(),0x2d1a0);}
    output.set(active.render(frames-position),position);phase=clock.phase;return output;
   }catch(error){close();throw error;}finally{rendering=false;}
  },
  close,
 };
}
