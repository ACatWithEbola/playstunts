/** Proven stack span from the original localized prompt lookup1ADDC..1AE0E
 * through required-resource lookup22F15. Both score-entry callers place this
 * wrapper at outer BP-B0. Saved SI/DI are written only when supplied by the caller. */
export function writeOriginalHighScorePromptFrame(memory:Uint8Array,d:number,outerBP:number,misc:{offset:number;segment:number},registers?:{si?:number;di?:number}){
 const frame=(outerBP-0xb0)&65535,view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength);
 const word=(delta:number,value:number)=>view.setUint16(d+((frame+delta)&65535),value&65535,true);
 if(registers?.di!==undefined)word(-22,registers.di);
 if(registers?.si!==undefined)word(-20,registers.si);
 word(-18,d>>>4);word(-16,frame);word(-14,0x153b);word(-12,0x198d);
 word(-10,misc.offset);word(-8,misc.segment);word(-6,frame-4);
 memory[d+((frame-4)&65535)]=memory[d+0xaa6e];
 for(let i=0;i<3;i++)memory[d+((frame-3+i)&65535)]=memory[d+0x4c0+i];
}
