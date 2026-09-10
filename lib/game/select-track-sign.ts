import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
/** Supplied D1B2..D1F2: sign index lookup and intact/broken visibility branch. */
export function selectOriginalTrackSign(memory:Uint8Array,d:number,column:number,row:number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga){
 const v=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),word=(p:number)=>v.getUint16(d+(p&65535),true),signed=(n:number)=>n<<24>>24;
 const offset=(word(layout.address(0xa466))+word(layout.address(0xa350)+signed(row)*2)+signed(column))&65535;
 const index=memory[word(layout.address(0xa468))*16+offset];
 if(index===255)return {index,mode:'none' as const};
 if(memory[d+((layout.address(0x8eb0)+signed(index))&65535)]===0)return {index,mode:'intact' as const};
 return {index,mode:memory[d+layout.address(0x8ee0)]?'particles' as const:'none' as const};
}
