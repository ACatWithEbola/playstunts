import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
const view=(driver:Uint8Array)=>new DataView(driver.buffer,driver.byteOffset,driver.byteLength);
const playback=(driver:Uint8Array):OriginalTandyBiosSound=>{const v=view(driver);return {ax:0x8300|driver[0x50e],es:v.getUint16(0x508,true),bx:v.getUint16(0x506,true),cx:v.getUint16(0x50a,true),dx:v.getUint16(0x50c,true)};};
export class OriginalTandySampleDivideError extends RangeError {
 readonly bios:OriginalTandyBiosSound[];
 constructor(bios:OriginalTandyBiosSound[]){super('TD15 sample divisor causes original 16-bit DIV overflow');this.name='OriginalTandySampleDivideError';this.bios=bios;}
}
/** TD15:B33 issues BIOS DAC requests. It deliberately does not set the active
 * flag, including after requesting a one-byte silent sample. */
export function startOriginalTandySample(driver:Uint8Array,driverSegment:number,channel:number,sample:{offset:number;segment:number;length:number},rate:number,repeats:number){
 const bios:OriginalTandyBiosSound[]=[];if(channel!==0)return {bios,chain:false};
 if(driver[0x504]===1)bios.push({ax:0x8300,es:driverSegment,bx:0x50f,cx:1,dx:1});
 const v=view(driver);driver[0x505]=repeats&255;v.setUint16(0x506,(sample.offset+50)&65535,true);v.setUint16(0x508,sample.segment,true);v.setUint16(0x50a,sample.length,true);
 const divisor=Math.floor(0x36b000/(rate&65535));
 // B64..B7E already changed these fields when B8B raises INT0. Preserve
 // those changes and the preceding BIOS request for the host's fault path.
 if(divisor>65535)throw new OriginalTandySampleDivideError(bios);
 v.setUint16(0x50c,divisor,true);driver[0x50e]=driver[0x516]>>>1;
 if(sample.length&65535)bios.push(playback(driver));return {bios,chain:false};
}
/** TD15:AE7 consumes only INT15 AX=91FB. A repeat count of zero loops;
 * count one stops on this completion. Other callbacks chain the saved vector. */
export function completeOriginalTandySample(driver:Uint8Array,ax:number){
 const bios:OriginalTandyBiosSound[]=[];if(ax!==0x91fb)return {bios,chain:true};
 if(driver[0x504]!==1)return {bios,chain:false};
 if(driver[0x505]!==0){driver[0x505]--;if(driver[0x505]===0){driver[0x504]=0;return {bios,chain:false};}}
 bios.push(playback(driver));return {bios,chain:false};
}
