import {WORLD_DISPLAY_LAYOUTS} from './world-display-layout.ts';
import type {OriginalTrackDisplayLayout} from './track-display-layout.ts';
/** Original CE88..CF0E table lookups. Original map rows run opposite to world
 * Z. Read the actual tables, including retained adjacent words for malformed
 * edge footprints, instead of extrapolating coordinates beyond the tables.
 */
export function renderTileWorldOrigin(memory:Uint8Array,d:number,column:number,row:number,multiTile:number,layout:OriginalTrackDisplayLayout=WORLD_DISPLAY_LAYOUTS.mcga):[number,number,number]{
 const view=new DataView(memory.buffer,memory.byteOffset,memory.byteLength),signed=(n:number)=>n<<24>>24;
 const word=(offset:number)=>view.getInt16(d+(offset&65535),true);
 return [word(layout.address(multiTile&2?0x7378:0xa3e2)+signed(column)*2),0,word(layout.address(multiTile&1?0x7f9e:0xa796)+signed(row)*2)];
}
