import {createPlayerAudio,type PlayerAudioSeed} from './player-audio.ts';
import {createQueuedPlayerAudio} from './queued-player-audio.ts';
import type {DrivingAudioQueueSeed} from './driving-audio-queue.ts';
import {audioTimerSampleOffsets} from './audio-sample-clock.ts';
import {adlibReset} from './adlib-release.ts';
export interface PlayerAudioChip {write(register:number,value:number):void;generate(samples:number):void;getBuffer():Int16Array}
/** Shared stereo OPL stream, advancing the original IRQ between sample spans.
 * The chip must be a newly created OPL2-compatible instance.
 */
export function createPlayerAudioStream(seed:PlayerAudioSeed,chip:PlayerAudioChip,sampleRate:number){
 const player=createPlayerAudio(seed);
 return {...createAudioRuntimeStream(player,chip,sampleRate),setEnabled(enabled:boolean){for(const [r,v] of player.setEnabled(enabled))chip.write(r,v);},crash(){for(const [r,v] of player.crash())chip.write(r,v);},update:player.update};
}
export function createQueuedPlayerAudioStream(seed:PlayerAudioSeed,queueSeed:DrivingAudioQueueSeed,chip:PlayerAudioChip,sampleRate:number){
 const player=createQueuedPlayerAudio(seed,queueSeed);
 return {...createAudioRuntimeStream(player,chip,sampleRate),setEnabled(enabled:boolean){for(const [r,v] of player.setEnabled(enabled))chip.write(r,v);},crash(){for(const [r,v] of player.crash())chip.write(r,v);},exit(){for(const [register,value] of player.exit())chip.write(register,value);},impacts(flags:number){for(const [register,value] of player.impacts(flags))chip.write(register,value);},enqueueView(...args:Parameters<typeof player.enqueueView>){for(const [register,value] of player.enqueueView(...args))chip.write(register,value);},enqueue(...args:Parameters<typeof player.enqueue>){for(const [register,value] of player.enqueue(...args))chip.write(register,value);}};
}
interface AudioRuntime {initialWrites:number[][];tick():number[][]}
export function createAudioRuntimeStream(player:AudioRuntime,chip:PlayerAudioChip,sampleRate:number){
 let phase=0;
 const write=(writes:number[][])=>{for(const [register,value] of writes)chip.write(register,value);};
 // Original AD15 initialization 0x997-0x9b8.
 write([[1,32],[8,0],[0xbd,0]]);
 for(let channel=0;channel<9;channel++)write(adlibReset(channel));
 write(player.initialWrites);
 return {
  render(samples:number){
   const clock=audioTimerSampleOffsets(phase,samples,sampleRate),output=new Int16Array(samples*2);
   let position=0;
   const generateUntil=(end:number)=>{
    while(position<end){
     const count=Math.min(512,end-position);chip.generate(count);
     const buffer=chip.getBuffer();
     if(buffer.length<count*2)throw Error('AdLib chip returned an incomplete stereo buffer');
     output.set(buffer.subarray(0,count*2),position*2);position+=count;
    }
   };
   for(const boundary of clock.offsets){generateUntil(boundary);write(player.tick());}
   generateUntil(samples);phase=clock.phase;return output;
  },
 };
}
