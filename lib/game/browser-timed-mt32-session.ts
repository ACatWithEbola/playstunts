import {createBrowserNativeTimedMt32Music} from './browser-native-timed-mt32-music.ts';
import type {BrowserMt32Power} from './browser-native-mt32-music.ts';
import {createClockOwnedTimedMusic} from './clock-owned-timed-music.ts';
import {createRetainedMenuClockOwner} from './retained-menu-clock-owner.ts';
import type {RetainedMenuClock} from './retained-menu-clock.ts';
import type {BrowserTimedDemoRoland} from './browser-native-demo.ts';
import type {OriginalMt32MpuProgram} from './mt32-transport.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';

/** Modern original Roland delivery is an engine capability, not a QA query.
 * Legacy keeps its existing working path, independently of URL parameters. */
export function browserUsesTimedMt32(_location:Pick<Location,'hostname'|'search'>,soundDevice:string|undefined,generation:PhysicsEngineVersion){
 return soundDevice==='mt32'&&generation==='ms-1991';
}

/** Resource reconstruction only. This does not deliver physical MIDI or model
 * MPU timing; the separately owned timed race performs device initialization. */
export function reconstructTimedMt32Resources(program:OriginalMt32MpuProgram){
 const writes:number[][]=[];let step=program.next();
 while(!step.done){if(step.value.kind==='write')writes.push([step.value.port,step.value.value]);step=program.next(0);}
 return {result:step.value,writes};
}

/** Explicit opening/menu/race connector. Does not select itself, change a
 * release default, or own the caller's physical power/AudioContext. */
export async function createBrowserTimedMt32Session(options:{context:AudioContext;signal:AbortSignal;power:BrowserMt32Power;generation:'ms-1990'|'ms-1991';profile:BrowserTimedDemoRoland['profile'];clock:RetainedMenuClock;wallTicks:()=>number;patch:Uint8Array}){
 const {context,signal,power,generation,wallTicks}=options;
 const patch=Uint8Array.from(options.patch),profile={...options.profile};
 const clock=createRetainedMenuClockOwner(options.clock,wallTicks);
 let guardedRun=0,maxGuardedRun=0,hardwareTicks=0;
 const connection=await createBrowserNativeTimedMt32Music(context,signal,power,generation,profile,dispatch=>{hardwareTicks++;guardedRun=dispatch?0:guardedRun+1;maxGuardedRun=Math.max(maxGuardedRun,guardedRun);clock.audioTick();});
 // Bind the device captured by the music factory, not a second power lookup
 // that could have changed across the awaited connection handover.
 const device=connection.device;
 if(signal.aborted||power.device!==device){await connection.music.closeAsync();throw new DOMException('Timed Roland session cancelled or device replaced during startup','AbortError');}
 const music=createClockOwnedTimedMusic(connection.music,clock);
 let closed=false,release:Promise<void>|undefined;
 const check=()=>{if(closed||signal.aborted||connection.deviceChanged())throw new DOMException('Timed Roland session closed or device replaced','AbortError');};
 return {music,clock,power,output:connection.output,get diagnostics(){return {...music.deliveryDiagnostics,hardwareTicks,maxGuardedRun};},
  race():BrowserTimedDemoRoland{
   check();return {device:connection.playbackDevice,generation,patch:Uint8Array.from(patch),profile:{...profile},async stopMusic(){check();await music.stopAsync();check();}};
  },
  async restoreMenuClock(retained:RetainedMenuClock){check();await music.stopAsync();check();clock.adoptRetainedClock(retained);},
  closeAsync(){if(!release){closed=true;release=music.closeAsync();}return release;},
 };
}
