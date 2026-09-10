import type {Mt32StereoOutput} from './mt32-audio-stream.ts';
/** The game's clock and MIDI sender survive removal of the physical device.
 * Bytes sent while powered off are lost; a fresh device starts with its ROM
 * defaults, without silently replaying an earlier game patch upload. */
export function createSwitchableMt32Output<T extends Mt32StereoOutput&{close():void}>(sampleRate:number,load:(signal:AbortSignal)=>Promise<T>){
 let device:T|undefined,closed=false,generation=0,controller:AbortController|undefined,pending:Promise<boolean>|undefined;
 const listeners=new Set<(device:T|undefined)=>void>();
 const subscribe=(listener:(device:T|undefined)=>void)=>{listeners.add(listener);listener(device);return()=>{listeners.delete(listener);};};
 const notify=()=>{for(const listener of listeners)listener(device);};
 const powerOff=()=>{generation++;controller?.abort();controller=undefined;pending=undefined;const previous=device;device=undefined;notify();previous?.close();};
 const close=()=>{if(closed)return;closed=true;powerOff();listeners.clear();};
 const output:Mt32StereoOutput&{close():void}={sampleRate,onDeviceChange:listener=>subscribe(()=>listener()),
  write(writes){if(!closed)device?.write(writes);},
  prepare(writes){if(!closed&&device){if(device.prepare)device.prepare(writes);else device.write(writes);}},
  render(frames){if(!Number.isSafeInteger(frames)||frames<0||frames>512)throw Error('Invalid Roland render block');if(closed)throw Error('Roland output is closed');return device?.render(frames)??new Float32Array(frames*2);},close,
 };
 return {output,get device(){return device;},get starting(){return !!pending;},
  subscribe,
  powerOff,close,
  powerOn():Promise<boolean>{
   if(closed)return Promise.resolve(false);if(device)return Promise.resolve(true);if(pending)return pending;
   const owner=++generation,loading=new AbortController();controller=loading;
   pending=(async()=>{
    try{
     const next=await load(loading.signal);
     if(closed||owner!==generation){next.close();return false;}
     if(next.sampleRate!==sampleRate){next.close();throw Error('Roland output sample rate changed');}
     device=next;notify();return true;
    }catch(error){if(closed||owner!==generation)return false;throw error;}
    finally{if(owner===generation){pending=undefined;controller=undefined;}}
   })();return pending;
  },
 };
}
