import type {AudioListenerView} from './view-audio-sample.ts';
import {createPlayerAudio,type PlayerAudioSeed} from './player-audio.ts';
import {createDrivingAudioQueue,type DrivingAudioQueueSeed} from './driving-audio-queue.ts';
import type {AudioSampleCar} from './audio-sample-build.ts';
/** Original registered callback order: hardware/effects, car smoothing, then
 * queued driving samples (0x14318 -> 0xaac0 -> 0x19558). Single player scope.
 */
export function createQueuedPlayerAudio(seed:PlayerAudioSeed,queueSeed:DrivingAudioQueueSeed){
 const player=createPlayerAudio(seed),queue=createDrivingAudioQueue(queueSeed);let active=seed.activeAudio;
 return {
  initialWrites:player.initialWrites,
  exit(){const q=queue.snapshot(),result=player.exit(active,q.read,q.write);if(active)queue.discardPending();active=false;return result.writes;},
  setEnabled:player.setEnabled,
  impacts(flags:number){return player.impacts(flags,active);},
  enqueue(car:AudioSampleCar,flags?:number){queue.enqueue(car);const writes=flags===undefined?[]:player.driveSounds(flags);active=true;return writes;},
  enqueueView(car:AudioSampleCar,view:AudioListenerView,flags?:number){queue.enqueueView(car,null,view);const writes=flags===undefined?[]:player.driveSounds(flags);active=true;return writes;},
  tick(){
   const writes=player.tick();
   for(const event of queue.tick()){
    const {rpm,previous,current}=event.player;
    player.update(rpm,previous,current,event.interval);
   }
   return writes;
  },
  crash:player.crash,
  snapshot(){return {player:player.snapshot(),queue:queue.snapshot()};},
 };
}
