import {createRaceAudio} from './race-audio.ts';
import {createDrivingAudioQueue,type DrivingAudioQueueSeed} from './driving-audio-queue.ts';
import type {AudioSampleCar} from './audio-sample-build.ts';
import type {AudioListenerView} from './view-audio-sample.ts';
/** Original hardware/car callbacks followed by 14318 -> aac0 queued targets. */
export function createQueuedRaceAudio(race:ReturnType<typeof createRaceAudio>,seed:DrivingAudioQueueSeed,playerHandle:number,opponentHandle:number|null,initiallyActive:boolean){
 const queue=createDrivingAudioQueue(seed);let active=initiallyActive;
 return {
  enqueue(player:AudioSampleCar,opponent:AudioSampleCar|null,view:AudioListenerView,flags?:{player:number;opponent:number}){
   if((opponentHandle===null)!==(opponent===null))throw Error('Opponent audio sample must match race selection');
   queue.enqueueView(player,opponent,view);
   const writes:number[][]=[];
   if(flags){writes.push(...race.driveSounds(playerHandle,flags.player));if(opponentHandle!==null)writes.push(...race.driveSounds(opponentHandle,flags.opponent));}
   active=true;return writes;
  },
  exit(){
   const q=queue.snapshot(),audio=race.snapshot(),other=opponentHandle??1;
   const result=race.exit({active:active?1:0,read:q.read,write:q.write,playerFlags:audio.soundFlags[playerHandle]??0,opponentFlags:audio.soundFlags[other]??0,opponentEnabled:opponentHandle===null?0:1,playerHandle,opponentHandle:other});
   if(active)queue.discardPending();active=!!result.queue.active;return result.writes;
  },
  tick(){
   const writes=race.tick();
   for(const event of queue.tick()){
    const player=event.player;race.update(playerHandle,player.rpm,player.previous,player.current,event.interval);
    if(opponentHandle!==null){const opponent=event.opponent;race.update(opponentHandle,opponent.rpm,opponent.previous,opponent.current,event.interval);}
   }
   return writes;
  },
  snapshot(){return {audio:race.snapshot(),queue:queue.snapshot(),active};},
 };
}
