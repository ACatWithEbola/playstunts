/** Original243E4 saves the prior BIOS mode once and registers2440C for exit.
 * A saved mode of zero is also the uninitialized sentinel in the executable. */
export function* saveOriginalVideoMode(memory:Uint8Array,d:number):Generator<{kind:'read-bios-video-mode'}, {error:null|'exit-callbacks'},number>{
 if(memory[d+0x4bc4])return {error:null};
 const mode=yield {kind:'read-bios-video-mode'};memory[d+0x4bc4]=mode&255;memory[d+0x4bc5]=memory[0x410];
 const word=(at:number)=>memory[d+(at&65535)]|(memory[d+((at+1)&65535)]<<8),put=(at:number,value:number)=>{memory[d+(at&65535)]=value&255;memory[d+((at+1)&65535)]=(value>>>8)&255;};
 for(let slot=0;slot<10;slot++){
  const at=0x3f26+slot*4;if(word(at)===0x3a2c&&word(at+2)===0x209e)return {error:null};
  if(!word(at+2)){put(at+2,0);put(at,0x3a2c);put(at+6,0);put(at+2,0x209e);return {error:null};}
 }
 return {error:'exit-callbacks'};
}
