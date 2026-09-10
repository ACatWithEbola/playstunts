/** Original AD15.DRV note conversion at 0x6ab, with AH=0 as called by note-on. */
const frequency=[86, 91, 96, 102, 108, 114, 121, 128, 136, 144, 153, 162] as const;
export function adlibNotePitch(note:number){
 if(!Number.isInteger(note)||note<0||note>=255)throw Error('AdLib note must be 0-254; 255 is the preserve-pitch command');
 return (frequency[note%12]|((Math.trunc(note/12)<<10)&65535))&65535;
}
