import {advanceRetainedMenuClock,type RetainedMenuClock} from './retained-menu-clock.ts';
/** Explicit host ownership; no automatic audio/device/clock selection.
 * Handover is allowed only after the old source has stopped delivering ticks.
 * Caller still owns original IRQ guards and the browser input clock mapping. */
export function createRetainedMenuClockOwner(initial:RetainedMenuClock,wallTicks:()=>number){
 let clock={...initial},mode:'wall'|'audio'='wall',last=wallTicks(),elapsed=0;
 const readWall=()=>{const now=wallTicks();if(!Number.isSafeInteger(now)||now<0||now<last)throw Error('Invalid retained menu wall clock');return now;};
 if(!Number.isSafeInteger(last)||last<0)throw Error('Invalid retained menu wall clock');
 const flush=()=>{const now=readWall();if(mode==='wall'){const ticks=now-last;clock=advanceRetainedMenuClock(clock,ticks);elapsed+=ticks;}last=now;};
 return {
  get source(){return mode;},
  inputClock:{counter(){flush();return elapsed;},gameCounter(){flush();return clock.gameCounter;}},
  snapshot(){flush();return {...clock};},
  adoptRetainedClock(next:RetainedMenuClock){
   if(mode!=='wall')throw Error('Retained clock replacement requires stopped audio ownership');
   const retained=advanceRetainedMenuClock(next,0);
   flush();clock=retained;
  },
  takeAudioOwnership(){flush();mode='audio';},
  takeWallOwnership(){flush();mode='wall';},
  audioTick(){if(mode!=='audio')throw Error('Audio tick has no retained menu clock ownership');clock=advanceRetainedMenuClock(clock,1);elapsed++;},
 };
}
