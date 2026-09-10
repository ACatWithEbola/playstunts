/** TD15:06DC stores the supplied byte shifted down to the driver's gain scale. */
export function setOriginalTandyVolume(driver:Uint8Array,channel:number,volume:number){driver[0x516+channel]=(volume&255)>>>3;}
/** TD15:06F4 handles controller7 only. */
export function controlOriginalTandyChannel(driver:Uint8Array,channel:number,controller:number,value:number){if((controller&255)===7)setOriginalTandyVolume(driver,channel,value);}
/** TD15:0765 reapplies the track's retained volume on instrument assignment. */
export function assignOriginalTandyInstrument(driver:Uint8Array,channel:number,timer:Uint8Array){setOriginalTandyVolume(driver,channel,timer[0x28]);}
/** TD15:0784 uses distinct divisor conversions for sample, PSG and PC tones. */
export function setOriginalTandyFrequency(voice:Uint8Array,channel:number,frequency:number){
 frequency&=65535;const sample=channel===0,psg=channel>=1&&channel<=4;
 const divisor=sample?(frequency<=0x370?0x3ff:Math.floor(0x36b0000/frequency)):psg?(frequency<=0x6d6?0x3ff:Math.floor(0x1b5030/frequency)):(frequency<=0x124?0:Math.floor(0x1234dc0/frequency));
 voice[4]=voice[6]=divisor&255;voice[5]=voice[7]=(divisor>>>8)&255;
}
/** TD15:0A06 clears the retained sample divisor for channel0, even when the
 * supplied divisor written into the voice is nonzero. */
export function setOriginalTandyDivisor(driver:Uint8Array,voice:Uint8Array,channel:number,divisor:number){voice[4]=voice[6]=divisor&255;voice[5]=voice[7]=(divisor>>>8)&255;if(channel===0)driver[0x50c]=driver[0x50d]=0;}
/** TD15:0526 writes a clamped10-bit value through the original adjacent ports. */
export function originalTandyToneWrites(driver:Uint8Array,channel:number,divisor:number){const value=Math.min(divisor&65535,1023);return [[0xc0,driver[0x521+(channel&255)]|(value&15)],[0xc1,value>>>4]];}
/** TD15:055D performs byte subtraction before ORing the original latch value. */
export function originalTandyVolumeWrites(driver:Uint8Array,channel:number,volume:number){return [[0xc0,driver[0x51c+(channel&255)]|((15-(volume&255))&255)]];}
