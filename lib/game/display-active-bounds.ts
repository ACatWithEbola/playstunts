/** Original active-only clipping setters: MCGA250B3/CGA25539/TDY25423/EGA25903.
 * Pixel X is retained verbatim; packed byte X uses unsigned shifts, even for
 * negative coordinates. No backing window descriptor is updated here. */
export function setOriginalDisplayActiveBounds(memory:Uint8Array,mode:'mcga'|'cga'|'tandy'|'ega',left:number,right:number,top:number,bottom:number){
 const block=mode==='mcga'?0x5d96:mode==='cga'?0x6864:mode==='tandy'?0x63d4:0x9114;
 const shift=mode==='mcga'?0:mode==='cga'?2:mode==='tandy'?1:3;
 const put=(at:number,value:number)=>{memory[0x209e0+block+at]=value&255;memory[0x209e0+block+at+1]=(value>>>8)&255;};
 put(24,left);put(10,(left&65535)>>>shift);put(26,right);put(12,(right&65535)>>>shift);put(14,top);put(16,bottom);
}
