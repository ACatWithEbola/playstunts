/** IBM5154-compatible EGA palette output, following MAME isa/ega.cpp.
 * The200-line compatibility path uses intensity bit4 and brown correction;
 * treating its register values as ordinary six-bit RGB gives wrong colours.
 * This is palette decoding only; monitor timing and analog response are external.
 * BSD-3-Clause, Wilbert Pol; see ega-planar-BSD-3-Clause.txt. */
export function egaPaletteRgb(register:number,monitor:'cga-compatible'|'enhanced'):[number,number,number]{
 let colour=register&63;
 if(monitor==='cga-compatible'){if(colour&16)colour|=56;if(colour===6)colour=20;}
 return [(colour&4?170:0)+(colour&32?85:0),(colour&2?170:0)+(colour&16?85:0),(colour&1?170:0)+(colour&8?85:0)];
}
export function decodeEgaDisplayPalette(registers:Uint8Array,monitor:'cga-compatible'|'enhanced',planeMask=15){
 if(registers.length<16)throw Error('Missing EGA attribute palette');
 return Array.from({length:16},(_,index)=>egaPaletteRgb(registers[index&(planeMask&15)],monitor));
}
