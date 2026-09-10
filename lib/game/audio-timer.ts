export interface AudioTimerState {driver:boolean;paused:number;busy:number;musicEnabled:number;musicPlaying:number;musicSuppressed:number}
export type AudioTimerEvent={kind:'voices'|'music'|'release'}|{kind:'effect';voice:number};
/** Original timer dispatch 0x2a1f0 and effect loop 0x2a28a. */
export function audioTimerEvents(s:AudioTimerState):AudioTimerEvent[]{
 if(!s.driver||s.paused!==0||s.busy!==0)return [];
 const events:AudioTimerEvent[]=[{kind:'voices'},{kind:s.musicEnabled===1&&s.musicPlaying===1&&s.musicSuppressed===0?'music':'release'}];
 // Original allocator includes voice 23, but this loop's strict bound omits it.
 for(let voice=16;voice<23;voice++)events.push({kind:'effect',voice});
 return events;
}
