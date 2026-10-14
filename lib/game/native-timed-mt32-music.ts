import type {NativeMusicScore} from './native-music-score.ts';
import type {createTimedMt32ScoreStream} from './timed-mt32-score-stream.ts';
import {createBrowserTimedMt32Audio} from './browser-timed-mt32-audio.ts';
import {ORIGINAL_PIT_DIVISOR,PC_PIT_INPUT_HZ} from './timer-interrupt.ts';
type Score=Awaited<ReturnType<typeof createTimedMt32ScoreStream>>;
type Operation=Parameters<Score['control']>[0];
export interface ScheduledMt32FadeObserver {volume(value:number,at:number):void;stopped():void}
/** Caller initializes the versioned driver and owns the physical device.
 * release must silence/settle the old score before another factory uses it.
 * No ready-MPU fallback, execution profile or engine version is inferred. */
export function createNativeTimedMt32Music(context:AudioContext,createScore:(name:NativeMusicScore,cancelled:()=>boolean)=>Promise<{score:Score;release():Promise<void>}>){
 let closed=false,epoch=0,muted=false;
 let settings={musicEnabled:true,soundEnabled:true,paused:false};
 let current:{score:Score;release():Promise<void>}|undefined;
 let audio:ReturnType<typeof createBrowserTimedMt32Audio>|undefined,timer:ReturnType<typeof setInterval>|undefined;
 let queue:Promise<unknown>=Promise.resolve(),cleanup:Promise<void>=Promise.resolve();
 let failure:unknown,playbackStartAt:number|undefined;
 let scheduledBuffers=0,maxGapSeconds=0,lastGapSeconds=0;
 let largestGap:Parameters<NonNullable<Parameters<typeof createBrowserTimedMt32Audio>[3]>>[0]|undefined;
 let frameOrigin:number|undefined;
 const stop=()=>{
  epoch++;playbackStartAt=undefined;clearInterval(timer);audio?.close();audio=undefined;
  const old=current;current=undefined;
  if(old){old.score.close();cleanup=cleanup.then(()=>old.release()).catch(error=>{failure=error;});}
 };
 const enqueue=<T>(operation:()=>Promise<T>)=>{const pending=queue.catch(()=>{}).then(operation);queue=pending;return pending;};
 const check=(owner:number)=>{if(closed||owner!==epoch)throw new DOMException('Roland music superseded','AbortError');if(failure)throw failure;};
 const control=(operation:Operation)=>{
  if(current)throw Error('Timed Roland controls require controlAsync');
  if(operation==='toggle-music')settings.musicEnabled=!settings.musicEnabled;
  else if(operation==='toggle-sound')settings.soundEnabled=!settings.soundEnabled;
  else settings.paused=operation==='pause-audio';
  return operation==='toggle-music'?Number(settings.musicEnabled):operation==='toggle-sound'?Number(settings.soundEnabled):0;
 };
 const controlAsync=(operation:Operation)=>{
  const owner=epoch;
  return enqueue(async()=>{
   check(owner);if(!current)return control(operation);
   const result=await current.score.control(operation);check(owner);
   const state=current.score.settings;
   settings={musicEnabled:state.musicEnabled===1,soundEnabled:state.soundEnabled===1,paused:!!state.paused};
   if(settings.paused||!settings.musicEnabled)audio?.suspend();else audio?.resume();
   return result;
  });
 };
 const playAsync=(name:NativeMusicScore)=>{
  stop();const owner=epoch;
  return enqueue(async()=>{
   await cleanup;check(owner);if(!settings.musicEnabled)return;
   const created=await createScore(name,()=>closed||owner!==epoch);
   if(closed||owner!==epoch){created.score.close();try{await created.release();}catch(error){failure=error;throw error;}check(owner);}
   current=created;
   try{
    if(!settings.soundEnabled)await created.score.control('toggle-sound');
    if(settings.paused)await created.score.control('pause-audio');
    check(owner);
    frameOrigin=created.score.renderedFrame;
    audio=createBrowserTimedMt32Audio(context,created.score,()=>!closed&&owner===epoch,event=>{if(playbackStartAt===undefined)playbackStartAt=event.start;scheduledBuffers++;lastGapSeconds=event.gap;if(event.gap>maxGapSeconds)largestGap={...event};maxGapSeconds=Math.max(maxGapSeconds,event.gap);},4);
    audio.setVolume(muted?0:1);if(settings.paused)audio.suspend();await audio.pump();check(owner);
    timer=setInterval(()=>{
     if(!audio||owner!==epoch)return;
     void audio.pump().catch(error=>{if(owner===epoch){failure=error;stop();}});
    },25);
   }catch(error){if(owner===epoch)stop();throw error;}
  });
 };
 return {playAsync,play(_name:NativeMusicScore){throw Error('Timed Roland score startup requires playAsync');},control,controlAsync,
  get settings(){return {...settings};},get hasScore(){return !!current;},get failure(){return failure;},get playbackStartAt(){return playbackStartAt;},get deliveryDiagnostics(){return {scheduledBuffers,maxGapSeconds,lastGapSeconds,largestGap:largestGap?{...largestGap}:undefined};},fadeTicks:100,
  setOutputMuted(value:boolean,at=context.currentTime,fade=0){muted=value;audio?.setVolume(value?0:1,at,fade);},
  /** Web output fade: do not stall musical IRQs with repeated device SysEx
   * waits. Explicitly selected by the MS1991 Original presentation only. */
  async fadeOutContinuous(waitTicks:(ticks:number)=>Promise<void>,onStreamStopped?:()=>void){
   const owner=epoch;
   return enqueue(async()=>{
    try{
     check(owner);if(!current)return;
     audio?.setVolume(0,context.currentTime,100*ORIGINAL_PIT_DIVISOR/PC_PIT_INPUT_HZ);
     await waitTicks(100);check(owner);
     stop();await cleanup;if(failure)throw failure;
     onStreamStopped?.();
     await waitTicks(50);
    }catch(error){
     // A failed host wait must not leave its score and interval alive. A
     // superseding owner has already taken responsibility for its own cleanup.
     if(owner===epoch){stop();await cleanup;if(failure)throw failure;}
     throw error;
    }
   });
  },
  async fadeOut(waitTicks:(ticks:number)=>Promise<void>,onStreamStopped?:()=>void,observer?:ScheduledMt32FadeObserver){
   const owner=epoch;
   return enqueue(async()=>{
    let releaseFrame:(()=>void)|undefined;
    try{
     check(owner);if(!current)return;
     await current.score.fadeOut(waitTicks,async()=>{const stopped=audio;stopped?.close();await stopped?.pump();check(owner);onStreamStopped?.();},async()=>{check(owner);await audio?.pump();check(owner);await new Promise(resolve=>setTimeout(resolve,0));check(owner);},observer?{
      command(_value,frame){check(owner);if(frame===undefined||frameOrigin===undefined)throw Error('Roland fade lacks sample provenance');releaseFrame?.();releaseFrame=audio?.retainPlaybackFrame(frame-frameOrigin);if(!releaseFrame)throw Error('Roland fade audio owner missing');},
      volume(value,frame){check(owner);if(frame===undefined||frameOrigin===undefined)throw Error('Roland fade lacks sample provenance');const at=audio?.playbackTimeForFrame(frame-frameOrigin);if(at===undefined)throw Error('Roland fade command has no scheduled playback time');observer.volume(value,at);releaseFrame?.();releaseFrame=undefined;check(owner);},
      stopped(){check(owner);observer.stopped();check(owner);}
     }:undefined);
     check(owner);stop();await cleanup;if(failure)throw failure;
    }catch(error){
     if(owner===epoch){stop();await cleanup;if(failure)throw failure;}
     throw error;
    }finally{releaseFrame?.();}
   });
  },stop,
  async stopAsync(){stop();await queue.catch(()=>{});await cleanup;if(failure)throw failure;},
  async closeAsync(){if(!closed){stop();closed=true;}await queue.catch(()=>{});await cleanup;if(failure)throw failure;},
  close(){if(closed)return;stop();closed=true;},
 };
}
