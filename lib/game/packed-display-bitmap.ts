import {drawOriginalUnclippedPackedBitmap} from './cockpit-bitmap-raster.ts';
import {drawOriginalPackedBitmap} from './draw-packed-bitmap.ts';
/** Original CGA2649A/264B8 and TDY26210/2622E. The descriptor width
 * and clipping bounds count bytes; authored x is shifted to a byte column.
 * Unaligned x deliberately rounds down, without shifting the bitmap bits. */
export function drawOriginalPackedDisplayBitmap(memory:Uint8Array,mode:'cga'|'tandy',offset:number,segment:number,position?:{x:number;y:number}){
 const base=(segment&65535)*16,word=(at:number)=>memory[base+(at&65535)]|(memory[base+((at+1)&65535)]<<8);
 const x=position?.x??word(offset+8),y=position?.y??word(offset+10);
 drawOriginalPackedBitmap(memory,offset,segment,(x<<16>>16)>>(mode==='cga'?2:1),y,0x209e0,mode==='cga'?0x6864:0x63d4);
}

/** CGA2527E/26EA2 and TDY25176/26A32 use stored positions and run
 * until the stream terminator, regardless of descriptor height or bounds. */
export function maskOriginalPackedDisplayBitmap(memory:Uint8Array,mode:'cga'|'tandy',offset:number,segment:number,operation:'and'|'or'){
 const base=(segment&65535)*16,word=(at:number)=>memory[base+(at&65535)]|(memory[base+((at+1)&65535)]<<8);
 drawOriginalUnclippedPackedBitmap(memory,offset,segment,(word(offset+8)<<16>>16)>>(mode==='cga'?2:1),word(offset+10),operation,0x209e0,mode==='cga'?0x6864:0x63d4);
}

/** Original CGA26674/26692 and TDY263E2/26400 unclipped compressed copy. */
export function drawOriginalUnclippedPackedDisplayBitmap(memory:Uint8Array,mode:'cga'|'tandy',offset:number,segment:number,position?:{x:number;y:number},operation:'copy'|'and'|'or'='copy'){
 const base=(segment&65535)*16,word=(at:number)=>memory[base+(at&65535)]|(memory[base+((at+1)&65535)]<<8);
 drawOriginalUnclippedPackedBitmap(memory,offset,segment,((position?.x??word(offset+8))<<16>>16)>>(mode==='cga'?2:1),position?.y??word(offset+10),operation,0x209e0,mode==='cga'?0x6864:0x63d4);
}
