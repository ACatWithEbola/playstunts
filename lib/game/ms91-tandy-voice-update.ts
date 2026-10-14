import {bendOriginalTandyPitch} from './tandy-pitch.ts';
import {originalTandyToneWrites,originalTandyVolumeWrites} from './tandy-control.ts';
/** Original modern TD15:0841..0A20; explicit register input and virtual writes. */
export function updateMs91TandyVoice(driver:Uint8Array,channel:number,voice:Uint8Array,timer:Uint8Array,instrument:Uint8Array,incomingCx:number,port61:number){
 if(driver.length!==3241||voice.length<46||timer.length<72||instrument.length<0x36)throw Error('Incomplete modern Tandy voice state');
 const writes:number[][]=[];let cx=incomingCx&65535;
 if(!voice[1])return {writes,cx};
 const word=(b:Uint8Array,at:number)=>b[at]|b[at+1]<<8,put=(b:Uint8Array,at:number,n:number)=>{b[at]=n&255;b[at+1]=(n>>>8)&255;};
 const table=(channel&65535)<=3?0x3a7:cx===4?0x557:0x23f;
 const note=(voice[3]+(instrument[0x35]===1?voice[0x22]:0))&255;driver[0x577]=note;
 let frequency=instrument[0x35]===1?word(driver,table+note*2):word(voice,4);
 frequency=(frequency-(instrument[0x11]<<24>>24))&65535;
 frequency=bendOriginalTandyPitch(driver,table,note,frequency,word(timer,0x26),instrument[0x12]);
 if(instrument[0x28]===2)frequency=(frequency+word(voice,0x1c))&65535;
 if(instrument[0x19]===2)frequency=(frequency+word(voice,0x14))&65535;
 put(voice,6,frequency);
 let volume=driver[0x13f+driver[0x3f+(((driver[0x5af+channel]<<4)&255)|driver[0x5a9+channel])]];
 if(instrument[0x19]===3)volume=driver[0x13f+driver[0x3f+(((volume<<4)&255)|voice[0x15])]];
 cx=frequency;
 if(channel>=1&&channel<=4)writes.push(...originalTandyVolumeWrites(driver,channel,volume,'ms-1991'),...originalTandyToneWrites(driver,channel,frequency,'ms-1991'));
 else if(channel===0){put(driver,0x593,frequency);cx=frequency&4095;driver[0x583]=volume>>>1;writes.push([0xc6,cx&255],[0xc7,((volume<<4)&224)|(cx>>>8)]);}
 else if(driver[0x5b4]===0)writes.push([0x61,port61&252]);
 else writes.push([0x42,frequency&255],[0x42,frequency>>>8],[0x61,(port61|3)&255]);
 return {writes,cx};
}
