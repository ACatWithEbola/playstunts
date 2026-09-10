export interface OriginalTrackDisplayLayout {address:(mcga:number)=>number}
const middle=new Set([0x732e,0x7376,0x7378,0x7820,0x7c40,0x7c56,0x7c6c,0x7f9e]);
const upper=new Set([0x7fe4,0x909e,0x9b30,0x9b32,0x9be2,0xa398,0xa39c,0x89d4,0x9022,0x90a4,0x9356,0x9358,0x9ad0,0x9ad2,0xa350,0xa3e2,0xa796]);
/** Track-grid and overview operands from281B..28AC andE91D..ED51.
 * EGA descriptor/coordinate storage has a four-byte alignment difference
 * from its later state globals; do not apply a single global displacement. */
export const TRACK_DISPLAY_LAYOUTS:Record<'mcga'|'cga'|'tandy'|'ega',OriginalTrackDisplayLayout>={
 mcga:{address:n=>n},cga:{address:n=>n+(middle.has(n)||upper.has(n)?0x5e0:0)},tandy:{address:n=>n+(middle.has(n)||upper.has(n)?0x620:0)},ega:{address:n=>n+(middle.has(n)?0x460:upper.has(n)?0x45c:0)},
};
