import {originalTandyToneWrites,originalTandyVolumeWrites} from './tandy-control.ts';
import type {OriginalTandyBiosSound} from './tandy-voice-update.ts';
import type {PhysicsEngineVersion} from '../physics/engine-version.ts';
import {tandyDriverLayout} from './tandy-driver-layout.ts';
export interface OriginalTandyVector {offset:number;segment:number}
const silentSample=(segment:number):OriginalTandyBiosSound=>({ax:0x8300,es:segment,bx:0x50f,cx:1,dx:1});
function stopIdleModern(driver:Uint8Array){
 if(driver.length!==3241||driver[0x595])throw Error('Modern Tandy stop requires explicit active sample completion');
 driver[0x5a6]=0;driver[0x57e]=255;driver[0x57f]=255;driver[0x582]=1;
}
/** TD15:05D4 clears the PC gate, requests one silent sample and mutes four PSG slots. */
export function silenceOriginalTandy(driver:Uint8Array,driverSegment:number,port61:number,generation?:PhysicsEngineVersion){if(generation==='ms-1991'){stopIdleModern(driver);return {writes:[[0x61,port61&254],...[1,2,3,4].flatMap(channel=>originalTandyVolumeWrites(driver,channel,0,generation))],bios:[] as OriginalTandyBiosSound[]};}driver[0x504]=0;return {writes:[[0x61,port61&254],...[1,2,3,4].flatMap(channel=>originalTandyVolumeWrites(driver,channel,0))],bios:[silentSample(driverSegment)]};}
/** TD15:0579 stores the prior INT15 vector and registers its sample callback. */
export function initializeOriginalTandy(driver:Uint8Array,driverSegment:number,port61:number,previous:OriginalTandyVector,generation?:PhysicsEngineVersion){
 const silent=silenceOriginalTandy(driver,driverSegment,port61,generation),layout=tandyDriverLayout(generation);driver.fill(15,layout.volume,layout.volume+6);
 if(generation==='ms-1991')return {...silent,writes:[[0x43,0xb6],...silent.writes,[0xc4,0]],channels:6,installVector:{...previous}};
 const v=new DataView(driver.buffer,driver.byteOffset,driver.byteLength);v.setUint16(0x500,previous.offset&65535,true);v.setUint16(0x502,previous.segment&65535,true);
 return {...silent,writes:[[0x43,0xb6],...silent.writes],channels:6,installVector:{offset:0xae7,segment:driverSegment}};
}
/** TD15:05C2 leaves the saved pointer retained after restoring it. */
export function shutdownOriginalTandy(driver:Uint8Array,driverSegment:number,port61:number,generation?:PhysicsEngineVersion){const silent=silenceOriginalTandy(driver,driverSegment,port61,generation);return {...silent,restoreVector:generation==='ms-1991'?undefined:{offset:driver[0x500]|driver[0x501]<<8,segment:driver[0x502]|driver[0x503]<<8}};}
/** TD15:071C melodic stop clears tone then volume; sample stop also clears
 * the PC gate, as does the dedicated PC-tone channel5 stop. */
export function stopOriginalTandyChannel(driver:Uint8Array,driverSegment:number,channel:number,port61:number,generation?:PhysicsEngineVersion){
 const program=runOriginalTandyChannelStop(driver,driverSegment,channel,port61,generation);let step=program.next();while(!step.done)step=program.next();return step.value;
}
export function* runOriginalTandyChannelStop(driver:Uint8Array,driverSegment:number,channel:number,port61:number,generation?:PhysicsEngineVersion,deferBios=false):Generator<{driver:Uint8Array;writes:number[][];bios:OriginalTandyBiosSound[]},{writes:number[][];bios:OriginalTandyBiosSound[]},Uint8Array|undefined>{
 if(generation==='ms-1991'){
  // Original0799 CMP AX,0/JB cannot take its sample-stop branch. Channel0
  // therefore follows the tone-write branch, exactly like the binary.
  return {writes:(channel&65535)<=4?[...originalTandyToneWrites(driver,channel,0,generation),...originalTandyVolumeWrites(driver,channel,0,generation)]:[[0x61,port61&252]],bios:[] as OriginalTandyBiosSound[]};
 }
 if(channel>=1&&channel<=4)return {writes:[...originalTandyToneWrites(driver,channel,0),...originalTandyVolumeWrites(driver,channel,0)],bios:[] as OriginalTandyBiosSound[]};
 const bios:OriginalTandyBiosSound[]=[];if(channel===0){driver[0x504]=0;bios.push(silentSample(driverSegment));if(deferBios){const resumed=yield {driver,writes:[],bios:bios.map(request=>({...request}))};if(resumed){if(resumed.length!==driver.length)throw Error('Invalid resumed legacy Tandy driver');driver.set(resumed);}}}
 return {writes:[[0x61,port61&254]],bios};
}
