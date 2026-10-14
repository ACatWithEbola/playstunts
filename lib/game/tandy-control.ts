import {tandyDriverLayout} from './tandy-driver-layout.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
/** TD15:06DC stores the supplied byte shifted down to the driver's gain scale. */
export function setOriginalTandyVolume(driver:Uint8Array,channel:number,volume:number,generation?:PhysicsEngineVersion){driver[tandyDriverLayout(generation).volume+channel]=(volume&255)>>>3;}
/** Modern0744 additionally disables the speaker gate immediately. The caller
 * supplies the actual port state and must deliver the returned ordered writes. */
export function originalTandyVolumeGateWrites(channel:number,volume:number,port61:number,generation?:PhysicsEngineVersion):number[][]{
 return generation==='ms-1991'&&channel===5&&((volume&255)>>>3)===0?[[0x61,port61&0xfc]]:[];
}
/** TD15:06F4 handles controller7 only. */
export function controlOriginalTandyChannel(driver:Uint8Array,channel:number,controller:number,value:number,generation?:PhysicsEngineVersion){if((controller&255)===7)setOriginalTandyVolume(driver,channel,value,generation);}
/** TD15:0765 reapplies the track's retained volume on instrument assignment. */
export function assignOriginalTandyInstrument(driver:Uint8Array,channel:number,timer:Uint8Array,generation?:PhysicsEngineVersion){setOriginalTandyVolume(driver,channel,timer[0x28],generation);}
/** TD15:0784 uses distinct divisor conversions for sample, PSG and PC tones. */
export function setOriginalTandyFrequency(voice:Uint8Array,channel:number,frequency:number,generation?:PhysicsEngineVersion){
 const modern=tandyDriverLayout(generation).bytes===3241;
 frequency&=65535;const sample=channel===0&&!modern,psg=channel>=1&&channel<=4;
 const divisor=sample?(frequency<=0x370?0x3ff:Math.floor(0x36b0000/frequency)):psg?(frequency<=0x6d6?0x3ff:Math.floor(0x1b5030/frequency)):(frequency<=0x124?0:Math.floor(0x1234dc0/frequency));
 voice[4]=voice[6]=divisor&255;voice[5]=voice[7]=(divisor>>>8)&255;
}
/** TD15:0A06 clears the retained sample divisor for channel0, even when the
 * supplied divisor written into the voice is nonzero. */
export function setOriginalTandyDivisor(driver:Uint8Array,voice:Uint8Array,channel:number,divisor:number,generation?:PhysicsEngineVersion){const at=tandyDriverLayout(generation).sampleDivisor;voice[4]=voice[6]=divisor&255;voice[5]=voice[7]=(divisor>>>8)&255;if(channel===0){driver[at]=driver[at+1]=0;}}
/** TD15:0526 writes a clamped10-bit value through the original adjacent ports. */
export function originalTandyToneWrites(driver:Uint8Array,channel:number,divisor:number,generation?:PhysicsEngineVersion){const value=Math.min(divisor&65535,1023);return [[0xc0,driver[tandyDriverLayout(generation).toneLatch+(channel&255)]|(value&15)],[0xc1,value>>>4]];}
/** TD15:055D performs byte subtraction before ORing the original latch value. */
export function originalTandyVolumeWrites(driver:Uint8Array,channel:number,volume:number,generation?:PhysicsEngineVersion){return [[0xc0,driver[tandyDriverLayout(generation).volumeLatch+(channel&255)]|((15-(volume&255))&255)]];}
