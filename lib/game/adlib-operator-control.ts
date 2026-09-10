import type {RegisterWrite} from './adlib.ts';
const operators=[0,1,2,8,9,10,16,17,18];
/** AD15.DRV067D dispatches81..85 to multiplier, level and feedback writes.
 * The helpers consume DL, preserving the driver's unsigned byte wrapping. */
export function adlibOperatorControl(instrument:ArrayLike<number>,channel:number,control:number,value:number):RegisterWrite[]{
 control&=65535;if(control<0x81||control>0x85)return [];
 if(!Number.isInteger(channel)||channel<0||channel>8||instrument.length<100)throw Error('Invalid original AdLib operator state');
 value&=255;
 if(control===0x85)return [[0xc0+channel,(((value>>>4)&7)<<1|instrument[0x44])&255]];
 const carrier=control===0x82||control===0x84,base=carrier?0x52:0x46,operator=operators[channel]+(carrier?3:0);
 if(control<=0x82)return [[0x20+operator,((instrument[base+10]<<7)|(instrument[base+9]<<6)|(instrument[base+8]<<5)|(instrument[base+7]<<4)|((value>>>3)&7))&255]];
 return [[0x40+operator,((instrument[base+5]<<6)|(((127-value)&255)>>>1&63))&255]];
}
