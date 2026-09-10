import {originalTandyToneWrites,originalTandyVolumeWrites} from './tandy-control.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
export interface OriginalTandyVector {offset:number;segment:number}
const silentSample=(segment:number):OriginalTandyBiosSound=>({ax:0x8300,es:segment,bx:0x50f,cx:1,dx:1});
/** TD15:05D4 clears the PC gate, requests one silent sample and mutes four PSG slots. */
export function silenceOriginalTandy(driver:Uint8Array,driverSegment:number,port61:number){driver[0x504]=0;return {writes:[[0x61,port61&254],...[1,2,3,4].flatMap(channel=>originalTandyVolumeWrites(driver,channel,0))],bios:[silentSample(driverSegment)]};}
/** TD15:0579 stores the prior INT15 vector and registers its sample callback. */
export function initializeOriginalTandy(driver:Uint8Array,driverSegment:number,port61:number,previous:OriginalTandyVector){
 const silent=silenceOriginalTandy(driver,driverSegment,port61);driver.fill(15,0x516,0x51c);
 const v=new DataView(driver.buffer,driver.byteOffset,driver.byteLength);v.setUint16(0x500,previous.offset&65535,true);v.setUint16(0x502,previous.segment&65535,true);
 return {...silent,writes:[[0x43,0xb6],...silent.writes],channels:6,installVector:{offset:0xae7,segment:driverSegment}};
}
/** TD15:05C2 leaves the saved pointer retained after restoring it. */
export function shutdownOriginalTandy(driver:Uint8Array,driverSegment:number,port61:number){const silent=silenceOriginalTandy(driver,driverSegment,port61);return {...silent,restoreVector:{offset:driver[0x500]|driver[0x501]<<8,segment:driver[0x502]|driver[0x503]<<8}};}
/** TD15:071C melodic stop clears tone then volume; sample stop also clears
 * the PC gate, as does the dedicated PC-tone channel5 stop. */
export function stopOriginalTandyChannel(driver:Uint8Array,driverSegment:number,channel:number,port61:number){
 if(channel>=1&&channel<=4)return {writes:[...originalTandyToneWrites(driver,channel,0),...originalTandyVolumeWrites(driver,channel,0)],bios:[] as OriginalTandyBiosSound[]};
 const bios:OriginalTandyBiosSound[]=[];if(channel===0){driver[0x504]=0;bios.push(silentSample(driverSegment));}
 return {writes:[[0x61,port61&254]],bios};
}
