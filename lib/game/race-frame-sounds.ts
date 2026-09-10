import type {CrashEffect} from './crash-state.ts';
export type RaceFrameSound={kind:'crash';handle:number}|{kind:'impact';handle:number;flags:number;active:boolean};
export function crashFrameSounds(effects:readonly CrashEffect[]):RaceFrameSound[]{return effects.flatMap(effect=>effect.type==='audio'?[{kind:'crash' as const,handle:effect.handle}]:[]);}
/** Frame-side requests preserve movement order and the original producer phase.
 * The independently registered audio timer is advanced by the caller. */
export function dispatchRaceFrameSounds(frame:{audio:'before-player'|'after-effects'|null;audioRequests:readonly import('./produce-race-audio.ts').RaceAudioRequest[];soundEvents:readonly RaceFrameSound[]},audio:{crash(handle:number):number[][];impacts(handle:number,flags:number,active:boolean):number[][];dispatchRequests(requests:readonly import('./produce-race-audio.ts').RaceAudioRequest[]):number[][]}){
 const writes:number[][]=[];
 if(frame.audio==='before-player')writes.push(...audio.dispatchRequests(frame.audioRequests));
 for(const event of frame.soundEvents)writes.push(...(event.kind==='crash'?audio.crash(event.handle):audio.impacts(event.handle,event.flags,event.active)));
 if(frame.audio==='after-effects')writes.push(...audio.dispatchRequests(frame.audioRequests));
 return writes;
}
