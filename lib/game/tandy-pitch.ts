/** TD15:0A23 and07E5 inspect incoming CX, rather than the channel argument,
 * when choosing the noise table for channels4 and5. Preserve that source quirk. */
export function originalTandyPitchTable(channel:number,incomingCx:number){return channel===0?0x41f:channel>=1&&channel<=3?0x32f:(incomingCx&65535)===4?0x4df:0x23f;}
export function bendOriginalTandyPitch(driver:Uint8Array,table:number,note:number,frequency:number,bend:number,range:number){
 const word=(at:number)=>driver[at]|driver[at+1]<<8;bend=bend<<16>>16;
 if(bend>0){const target=word(table+((note+range)&255)*2),delta=(frequency-target)&65535,factor=(bend+(bend>=4096?128:0))&65535;frequency-=Math.floor(delta*factor/8192)&65535;}
 else if(bend<0){const target=word(table+((note-range)&255)*2),delta=(target-frequency)&65535;frequency+=Math.floor(delta*((-bend)&65535)/8192)&65535;}
 return frequency&65535;
}
export function originalTandyPitch(driver:Uint8Array,channel:number,note:number,bend:number,range:number,incomingCx:number){const table=originalTandyPitchTable(channel,incomingCx),at=table+(note&255)*2;return bendOriginalTandyPitch(driver,table,note,driver[at]|driver[at+1]<<8,bend,range);}
