/** Original automatic effect allocation at loaded 0x2937e-0x29411. */
export function allocateEffectVoice(slots:{resource:number;busy:number}[]):number{
 if(slots.length!==8)throw Error('Original effect pool requires voices 16 through 23');
 const index=slots.findIndex(s=>s.resource===0 && s.busy===0);
 // Supplied executable's fallback at 0x293c4 tests the literal 0xa3aa,
 // always skipping the candidate update. A full pool therefore returns -1.
 return index<0?-1:index+16;
}
