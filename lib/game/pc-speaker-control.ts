/** PC15:02E8 initializes four tone channels and the original timer/vector state. */
export function initializeOriginalPcSpeaker(driver:Uint8Array,port61:number){
 const writes=silenceOriginalPcSpeaker(driver,port61);driver.fill(0,0x2d3,0x2d7);driver.fill(127,0x1b7,0x1bc);return {channels:5,writes:[[0x43,0xb6],...writes]};
}
/** Source031C clears only four melodic flags, retaining the sample flag. */
export function silenceOriginalPcSpeaker(driver:Uint8Array,port61:number){driver.fill(0,0x1a9,0x1ad);return [[0x61,port61&252]];}
/** Source0335 melodic path. NoteFF marks active while retaining its divisor. */
export function startOriginalPcSpeakerTone(driver:Uint8Array,channel:number,voice:Uint8Array,note:number){
 if(channel===0)throw Error('PC15 sample startup is not yet reconstructed');
 voice[3]=note&255;if(voice[3]!==255){const at=0x3f+voice[3]*2;voice[4]=voice[6]=driver[at];voice[5]=voice[7]=driver[at+1];}driver[0x1a8+channel]=255;
}
/** Source03AE: volume is a retained byte; tick selection treats any nonzero as on. */
export function setOriginalPcSpeakerVolume(driver:Uint8Array,channel:number,volume:number){driver[0x1b7+channel]=volume&255;}
/** Source03EF: frequency values through304 produce zero; higher values use
 * the supplied19090880 numerator, with no floating-point frequency mapping. */
export function setOriginalPcSpeakerFrequency(voice:Uint8Array,channel:number,frequency:number){
 if(channel===0)return;frequency&=65535;const value=frequency<=304?0:Math.floor(0x1234dc0/frequency);setOriginalPcSpeakerDivisor(voice,value);
}
/** Source052D directly stores the supplied16-bit divisor in both voice fields. */
export function setOriginalPcSpeakerDivisor(voice:Uint8Array,divisor:number){voice[4]=voice[6]=divisor&255;voice[5]=voice[7]=(divisor>>8)&255;}
export function stopOriginalPcSpeakerTone(driver:Uint8Array,channel:number){if(channel===0)throw Error('PC15 sample timer restoration is not yet reconstructed');driver[0x1a8+channel]=0;}
