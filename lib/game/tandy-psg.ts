/** PSG register/counter behavior adapted from MAME sn76496.cpp.
 * Copyright (c) Nicola Salmoria and contributors. BSD-3-Clause;
 * see public/licenses/sn76496-BSD-3-Clause.txt.
 * TI SN76489AN datasheet supplies frequency and attenuation definitions.
 * This is a sound-chip model, not executable or DOS emulation.
 */
export type OriginalTandyPsgVariant='sn76489'|'sn76489a'|'ncr8496'|'pssj3';
const profiles={
 sn76489:{feedback:0x4000,tap1:1,tap2:2,ncr:false,invert:true},
 sn76489a:{feedback:0x10000,tap1:4,tap2:8,ncr:false,invert:false},
 ncr8496:{feedback:0x8000,tap1:2,tap2:32,ncr:true,invert:true},
 pssj3:{feedback:0x8000,tap1:2,tap2:32,ncr:true,invert:false},
} as const;
/** Select a hardware profile explicitly: different Tandy generations have
 * different noise patterns. Input clocks are the external chip clock.
 * Register writes take effect immediately; bus READY/wait timing and physical
 * power-on phase are outside this model. NCR non-latch volume/noise writes
 * follow MAME's current behavior, which its maintainers mark unverified.
 */
export function createOriginalTandyPsg(variant:OriginalTandyPsgVariant){
 const profile=profiles[variant];if(!profile)throw Error('Unknown PSG hardware profile');
 const registers=new Uint16Array(8),counts=new Int32Array(4),periods=Int32Array.from([1024,1024,1024,0]),outputs=new Uint8Array(4),volumes=new Int32Array(4),gains=new Int32Array(16);
 let gain=8191;for(let i=0;i<15;i++){gains[i]=Math.floor(gain);gain/=1.258925412;}volumes.fill(gains[0]);
 let lastRegister=0,lfsr:number=profile.feedback,untilTick=16;
 const level=()=>{let sum=0;for(let i=0;i<4;i++)if(outputs[i])sum+=volumes[i];return (profile.invert?-sum:sum)/32768;};
 function dividedClock(){
  for(let i=0;i<3;i++)if(--counts[i]<=0){outputs[i]^=1;counts[i]=periods[i];}
  if(--counts[3]<=0){
   const first=(lfsr&profile.tap1)!==0;
   const second=(lfsr&profile.tap2)!==(profile.ncr?profile.tap2:0);
   const feedback=first!==((registers[6]&4)!==0&&second);
   lfsr=(lfsr>>>1)|(feedback?profile.feedback:0);outputs[3]=lfsr&1;counts[3]=periods[3];
  }
 }
 return {
  write(value:number){
   value&=255;const latch=!!(value&128);if(latch){lastRegister=(value>>>4)&7;if(profile.ncr&&lastRegister===6&&((value^registers[6])&4))lfsr=profile.feedback;registers[lastRegister]=(registers[lastRegister]&0x3f0)|(value&15);}
   const r=lastRegister,channel=r>>>1;
   if(r===0||r===2||r===4){if(!latch)registers[r]=(registers[r]&15)|((value&63)<<4);periods[channel]=registers[r]||1024;if(r===4&&(registers[6]&3)===3)periods[3]=periods[2]*2;}
   else if(r&1){volumes[channel]=gains[value&15];if(!latch)registers[r]=(registers[r]&0x3f0)|(value&15);}
   else{if(!latch)registers[r]=(registers[r]&0x3f0)|(value&15);const mode=registers[6]&3;periods[3]=mode===3?periods[2]*2:32<<mode;if(!profile.ncr)lfsr=profile.feedback;}
  },
  /** Integrate the held digital level over external clock cycles. */
  advanceClocks(clocks:number){
   if(!Number.isFinite(clocks)||clocks<0)throw Error('Invalid PSG clock span');let area=0;
   while(clocks>0){const span=Math.min(clocks,untilTick);area+=level()*span;clocks-=span;untilTick-=span;if(untilTick===0){dividedClock();untilTick=16;}}
   return area;
  },
  level,
  snapshot(){return {registers:Array.from(registers),counts:Array.from(counts),periods:Array.from(periods),outputs:Array.from(outputs),volumes:Array.from(volumes),lastRegister,lfsr};},
 };
}
