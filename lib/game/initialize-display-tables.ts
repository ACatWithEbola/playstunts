/** Data islands in the original graphics code segment: screen descriptors,
 * packed reveal and scanline tables, window-stack roots and EGA bitmap masks. Adjacent
 * executable routines are deliberately absent from the extracted assets. */
export const ORIGINAL_DISPLAY_DATA_RANGES={
 cga:[[0x530a,16],[0x6862,460],[0x70c8,2]],
 tandy:[[0x522e,16],[0x63d2,460],[0x6ad6,2]],
 ega:[[0x6130,4],[0x7eb4,9],[0x8e2c,16],[0x9112,30],[0x9a40,2],[0xb218,8],[0xbe4e,8]],
} as const;
export function initializeOriginalDisplayTables(memory:Uint8Array,mode:'cga'|'tandy'|'ega',blocks:readonly {offset:number;data:Uint8Array}[]){
 const ranges=ORIGINAL_DISPLAY_DATA_RANGES[mode],c=0x209e0;
 if(blocks.length!==ranges.length||ranges.some(([at,size],i)=>blocks[i].offset!==at||blocks[i].data.length!==size||c+at+size>memory.length))throw Error('Original graphics data does not match the display executable');
 for(const block of blocks)memory.set(block.data,c+block.offset);
}
