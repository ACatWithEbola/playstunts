/** TD15:061A assigns pitch and velocity. The caller supplies the retained CX
 * and DX used by noteFF, and resolves a sample descriptor only for channel0. */
export function startOriginalTandyNote(driver:Uint8Array,channel:number,voice:Uint8Array,instrument:Uint8Array,note:number,velocity:number,incomingCx:number,incomingDx:number,sample?:{offset:number;segment:number;length:number}){
 const word=(at:number)=>driver[at]|driver[at+1]<<8,put=(bytes:Uint8Array,at:number,value:number)=>{bytes[at]=value&255;bytes[at+1]=(value>>>8)&255;};
 voice[3]=note&255;let cx=incomingCx&65535,divisor=incomingDx&65535;
 if(voice[3]!==255){cx=channel&65535;const table=cx===0?0x41f:cx<=3?0x32f:cx===4?0x4df:0x23f,index=cx===4?(voice[3]*2)&15:voice[3]*2;divisor=word(table+index);put(voice,4,divisor);put(voice,6,divisor);}
 const scaled=((instrument[0x15]?velocity:127)&255)>>>3;driver[(0x510+cx)&65535]=driver[0x4ef+scaled];
 if(cx===0){if(!sample)throw Error('Original Tandy sample descriptor is missing');driver[0x504]=2;driver[0x505]=1;put(driver,0x50c,divisor);put(driver,0x506,(sample.offset+50)&65535);put(driver,0x508,sample.segment);put(driver,0x50a,sample.length);}
}
