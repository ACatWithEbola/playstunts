import {adlibNotePitch} from './adlib-note.ts';
import {adlibVolume} from './adlib-volume.ts';
/** Original melodic note-on path; preserve-pitch sentinel and channel 0 pending. */
export function adlibNoteOn(instrument:number[],channel:number,note:number,volume:number,velocity:number){
 const pitch=adlibNotePitch(note),operators=[0,1,2,8,9,10,16,17,18];
 const detuned=(pitch+((instrument[0x11]<<24)>>24))&65535;
 const effectiveVelocity=instrument[0x15]?velocity:127;
 const writes=[[0x40+operators[channel],63],[0x43+operators[channel],63],[0xa0+channel,pitch&255],[0xb0+channel,32|(pitch>>>8)],...adlibVolume(instrument,channel,volume,effectiveVelocity)];
 return {pitch,detuned,effectiveVelocity,writes};
}
