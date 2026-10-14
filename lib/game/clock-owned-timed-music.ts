import type {createRetainedMenuClockOwner} from './retained-menu-clock-owner.ts';
import type {createNativeTimedMt32Music} from './native-timed-mt32-music.ts';
/** Explicit menu-host bridge. Underlying player must suspend/close delivery
 * before awaited pause/stop resolves. This does not select an engine or profile.
 * Race clocks and original IRQ guard memory remain separately caller-owned. */
export function createClockOwnedTimedMusic(player:ReturnType<typeof createNativeTimedMt32Music>,clock:ReturnType<typeof createRetainedMenuClockOwner>){
 let epoch=0;
 const restore=()=>{if(!player.hasScore||player.settings.paused||!player.settings.musicEnabled)clock.takeWallOwnership();};
 return {...player,
  get settings(){return player.settings;},get hasScore(){return player.hasScore;},get failure(){return player.failure;},get playbackStartAt(){return player.playbackStartAt;},get deliveryDiagnostics(){return player.deliveryDiagnostics;},
  stop(){throw Error('Clock-owned timed music requires stopAsync');},
  close(){epoch++;player.close();clock.takeWallOwnership();},
  async playAsync(name:Parameters<typeof player.playAsync>[0]){
   const owner=++epoch;clock.takeAudioOwnership();
   try{await player.playAsync(name);if(owner===epoch)restore();}catch(error){if(owner===epoch)clock.takeWallOwnership();throw error;}
  },
  async controlAsync(operation:Parameters<typeof player.controlAsync>[0]){
   const owner=++epoch;if(operation==='resume-audio'||(operation==='toggle-music'&&!player.settings.musicEnabled&&!player.settings.paused))clock.takeAudioOwnership();
   try{const result=await player.controlAsync(operation);if(owner===epoch)restore();return result;}catch(error){if(owner===epoch)clock.takeWallOwnership();throw error;}
  },
  async stopAsync(){const owner=++epoch;try{await player.stopAsync();}finally{if(owner===epoch)clock.takeWallOwnership();}},
  async fadeOut(waitTicks:Parameters<typeof player.fadeOut>[0]){const owner=++epoch;try{await player.fadeOut(waitTicks,()=>{if(owner===epoch)clock.takeWallOwnership();});}finally{if(owner===epoch)clock.takeWallOwnership();}},
  async fadeOutContinuous(waitTicks:Parameters<typeof player.fadeOut>[0]){const owner=++epoch;try{await player.fadeOutContinuous(waitTicks,()=>{if(owner===epoch)clock.takeWallOwnership();});}finally{if(owner===epoch)clock.takeWallOwnership();}},
  async fadeOutObserved(waitTicks:Parameters<typeof player.fadeOut>[0],observer:NonNullable<Parameters<typeof player.fadeOut>[2]>){const owner=++epoch;try{await player.fadeOut(waitTicks,()=>{if(owner===epoch)clock.takeWallOwnership();},{volume(value,at){if(owner===epoch)observer.volume(value,at);},stopped(){if(owner===epoch)observer.stopped();}});}finally{if(owner===epoch)clock.takeWallOwnership();}},
  async closeAsync(){const owner=++epoch;try{await player.closeAsync();}finally{if(owner===epoch)clock.takeWallOwnership();}},
 };
}
